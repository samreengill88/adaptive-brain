import os 
import firebase_admin
from firebase_admin import credentials, firestore, storage
from dotenv import load_dotenv

load_dotenv()
cred_path = os.getenv("FIREBASE_CREDENTIALS")
storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")

# intialize firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        "storageBucket": storage_bucket
    })

# create database and connect storage
db = firestore.client()
bucket = storage.bucket()
