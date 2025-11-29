import streamlit as st
import os
import json
import pickle
from dotenv import load_dotenv

# --- RAG IMPORTS ---
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever, ContextualCompressionRetriever
from langchain_community.document_compressors import FlashrankRerank
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_retrieval_chain, create_history_aware_retriever
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# --- CONFIGURATION ---
load_dotenv()
st.set_page_config(page_title="Aarambh Dashboard", layout="wide", page_icon="🚑")

BM25_PATH = "./bm25_index.pkl"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
RERANK_MODEL = "ms-marco-TinyBERT-L-2-v2"
INDEX_NAME = "aarambh"
REPORTS_DIR = "incident_reports"

# Ensure reports directory exists for visual safety
os.makedirs(REPORTS_DIR, exist_ok=True)

# --- 1. SESSION STATE SETUP ---
if "chat_history" not in st.session_state:
    st.session_state.chat_history = ChatMessageHistory()

if "rag_chain" not in st.session_state:
    st.session_state.rag_chain = None

# --- 2. RAG LOGIC (CACHED) ---
@st.cache_resource
def initialize_rag_system():
    """Loads the heavy RAG components only once."""
    try:
        # A. Embeddings & Vector Store
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        vectorstore = PineconeVectorStore(
            index_name=INDEX_NAME, 
            embedding=embeddings
        )
        vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

        # B. BM25 (Local Keywords)
        with open(BM25_PATH, "rb") as f:
            bm25_retriever = pickle.load(f)

        # C. Hybrid & Reranking
        ensemble_retriever = EnsembleRetriever(
            retrievers=[bm25_retriever, vector_retriever],
            weights=[0.5, 0.5]
        )
        compressor = FlashrankRerank(model=RERANK_MODEL)
        compression_retriever = ContextualCompressionRetriever(
            base_compressor=compressor,
            base_retriever=ensemble_retriever
        )

        # D. LLM & Chains
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0,
            max_retries=2,
        )

        # Prompts
        context_system_prompt = (
            "Given a chat history and the latest user question, "
            "formulate a standalone question that can be understood "
            "without the chat history. Do NOT answer the question, "
            "just reformulate it if needed."
        )
        context_prompt = ChatPromptTemplate.from_messages([
            ("system", context_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        
        history_aware_retriever = create_history_aware_retriever(
            llm, compression_retriever, context_prompt
        )

        qa_system_prompt = (
            "You are an emergency-response assistant. "
            "Use ONLY the following context to answer. "
            "If you don't know, say 'I don't know'. "
            "Keep answers concise (max 3 sentences) and actionable.\n\n"
            "{context}"
        )
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

        question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
        rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
        
        return rag_chain

    except FileNotFoundError:
        st.error(f"❌ Could not find {BM25_PATH}. Please run ingest.py first.")
        return None
    except Exception as e:
        st.error(f"❌ RAG Init Error: {e}")
        return None

# Initialize RAG on first load
if st.session_state.rag_chain is None:
    st.session_state.rag_chain = initialize_rag_system()

# --- 3. UI LAYOUT ---

# --- SIDEBAR: Incident Reports Viewer ---
with st.sidebar:
    st.header("📋 Incident Reports")
    st.caption(f"Reading from: `{REPORTS_DIR}/`")
    
    # Refresh Button
    if st.button("🔄 Refresh Files"):
        st.rerun()

    # List Files
    files = [f for f in os.listdir(REPORTS_DIR) if f.endswith('.json')]
    
    if not files:
        st.info("No reports found yet.")
    else:
        selected_file = st.selectbox("Select a Report", files)
        
        if selected_file:
            file_path = os.path.join(REPORTS_DIR, selected_file)
            with open(file_path, "r") as f:
                data = json.load(f)
            
            st.markdown("---")
            st.subheader("📄 Report Details")
            st.json(data) # Beautified JSON display

# --- MAIN PAGE: RAG Chatbot ---
st.title("🚑 Aarambh Emergency Assistant")
st.markdown("Ask questions about protocols, emergency contacts, or previous incidents.")

# Display Chat History
for msg in st.session_state.chat_history.messages:
    role = "user" if msg.type == "human" else "assistant"
    with st.chat_message(role):
        st.markdown(msg.content)

# Chat Input
if prompt := st.chat_input("How can I help you?"):
    # 1. Display User Message
    with st.chat_message("user"):
        st.markdown(prompt)
    
    # 2. Get Bot Response
    if st.session_state.rag_chain:
        with st.chat_message("assistant"):
            with st.spinner("Searching emergency protocols..."):
                try:
                    # We manually manage history here to keep it simple with Streamlit's redraw model
                    response = st.session_state.rag_chain.invoke({
                        "input": prompt,
                        "chat_history": st.session_state.chat_history.messages
                    })
                    
                    answer = response['answer']
                    st.markdown(answer)
                    
                    # 3. Update History
                    st.session_state.chat_history.add_user_message(prompt)
                    st.session_state.chat_history.add_ai_message(answer)
                    
                except Exception as e:
                    st.error(f"Error generating response: {e}")
    else:
        st.error("RAG System is offline. Check API keys and BM25 index.")