import os
import pickle
import time
from dotenv import load_dotenv

# 1. Document Loading (Using your safe loader function)
from langchain_community.document_loaders import PyMuPDFLoader

# 2. Chunking
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 3. Embeddings
from langchain_huggingface import HuggingFaceEmbeddings

# 4. BM25 (Keyword Search)
from langchain_community.retrievers import BM25Retriever

# 5. Pinecone Vector Store (Official Integration)
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

# --- CONFIGURATION ---
DATA_PATH = "./Data/"
BM25_PATH = "./bm25_index.pkl"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
INDEX_NAME = "aarambh"

def load_all_pdfs(path):
    """
    Safe PDF loader that avoids DirectoryLoader issues.
    It walks through folders and loads PDFs one by one using PyMuPDF.
    """
    docs = []
    if not os.path.exists(path):
        print(f"Error: Data folder '{path}' not found.")
        return []

    for root, _, files in os.walk(path):
        for file in files:
            if file.lower().endswith(".pdf"):
                pdf_path = os.path.join(root, file)
                print(f"Loading: {file}")
                try:
                    loader = PyMuPDFLoader(pdf_path)
                    file_docs = loader.load()
                    docs.extend(file_docs)
                except Exception as e:
                    print(f"Failed to load {file}: {e}")
    return docs

def main():
    # 1. Check API Keys
    if "PINECONE_API_KEY" not in os.environ:
        os.environ["PINECONE_API_KEY"] = input("Enter Pinecone API Key: ")
    
    # 2. Load PDFs
    print("\n--- Step 1: Loading PDFs ---")
    docs = load_all_pdfs(DATA_PATH)
    
    if not docs:
        print(" No PDFs found. Please check your ./Data/ folder.")
        return

    # 3. Chunking
    print(f"\n--- Step 2: Chunking {len(docs)} pages ---")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )
    chunks = splitter.split_documents(docs)
    print(f"Created {len(chunks)} chunks.")

    # 4. Embeddings
    print("\n--- Step 3: Initializing Embeddings ---")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    # 5. Pinecone Setup
    print("\n--- Step 4: Connecting to Pinecone ---")
    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

    # Check/Create Index
    existing_indexes = [i.name for i in pc.list_indexes()]
    if INDEX_NAME not in existing_indexes:
        print(f"Creating Index '{INDEX_NAME}' (This takes ~10-20 seconds)...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=384,  # Matches BGE-Small
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        time.sleep(15) # Wait for initialization
    else:
        print(f"Index '{INDEX_NAME}' already exists.")

    # 6. Upload Vectors
    print("\n--- Step 5: Uploading Vectors to Cloud ---")
    PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name=INDEX_NAME
    )
    print("Vectors Uploaded.")

    # 7. Build Local BM25
    print("\n--- Step 6: Building Local BM25 Keyword Index ---")
    bm25_retriever = BM25Retriever.from_documents(chunks)
    bm25_retriever.k = 10

    with open(BM25_PATH, "wb") as f:
        pickle.dump(bm25_retriever, f)
    print(f"BM25 index saved to {BM25_PATH}")

    print("\nIngestion Complete! You are ready to chat.")

if __name__ == "__main__":
    main()