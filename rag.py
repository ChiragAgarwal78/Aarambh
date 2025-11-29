import os
import pickle
import getpass
from dotenv import load_dotenv

# --- 1. Imports for Logic ---
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain.retrievers import ContextualCompressionRetriever

# --- 2. Imports for Reranking & Chat ---
from langchain_community.document_compressors import FlashrankRerank
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_retrieval_chain, create_history_aware_retriever
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

load_dotenv()

# --- CONFIGURATION ---
BM25_PATH = "./bm25_index.pkl"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
RERANK_MODEL = "ms-marco-TinyBERT-L-2-v2"
INDEX_NAME = "aarambh"

# --- MEMORY SETUP ---
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

def load_brain():
    print("🚀 Connecting to Brain...")

    # 1. API Key Check
    if "PINECONE_API_KEY" not in os.environ:
        os.environ["PINECONE_API_KEY"] = getpass.getpass("Enter Pinecone API Key: ")
    if "GOOGLE_API_KEY" not in os.environ:
        os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter Google API Key: ")

    # 2. Connect to Pinecone (Cloud Vectors)
    print("☁️  Connecting to Pinecone...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    vectorstore = PineconeVectorStore(
        index_name=INDEX_NAME, 
        embedding=embeddings
    )
    vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

    # 3. Load BM25 (Local Keywords)
    print("📂 Loading Local Keywords...")
    try:
        with open(BM25_PATH, "rb") as f:
            bm25_retriever = pickle.load(f)
    except FileNotFoundError:
        print("❌ Error: bm25_index.pkl not found. You must run ingest.py first!")
        return None

    # 4. Hybrid Search (Vector + Keyword)
    print("⚡ constructing Hybrid Search...")
    ensemble_retriever = EnsembleRetriever(
        retrievers=[bm25_retriever, vector_retriever],
        weights=[0.5, 0.5]
    )

    # 5. Reranking (Refining Results)
    print("🧠 Initializing Reranker...")
    compressor = FlashrankRerank(model=RERANK_MODEL)
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=ensemble_retriever
    )
    
    return compression_retriever

def main():
    retriever = load_brain()
    if not retriever: return

    print("🤖 Initializing Gemini 2.0 Flash...")
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0, # 0 means strict/factual for emergency use
        max_retries=2,
    )

    # --- PROMPTS ---
    
    # 1. Rephrase user question based on history
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
        llm, retriever, context_prompt
    )

    # 2. Answer based on documents
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

    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    print("\n🚑 AARAMBH SYSTEM ONLINE. Type 'quit' to exit.")
    session_id = "unit_1"

    while True:
        user_input = input("\nUser: ")
        if user_input.lower() in ["quit", "exit"]: break
        
        try:
            print("Thinking...")
            response = conversational_rag_chain.invoke(
                {"input": user_input},
                config={"configurable": {"session_id": session_id}}
            )["answer"]
            print(f"Bot: {response}")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()