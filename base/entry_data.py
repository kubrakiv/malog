    # File path: delta-backend/base/entry_data.py

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# lkw authentication
lkw_auth = {
    "login": os.getenv("LKW_LOGIN"),
    "password": os.getenv("LKW_PASSWORD")
}

api_key = os.getenv("GOOGLE_API_KEY") # for ivan.kubrak.eu GMAIL

# data for message sending
phone = "+380504186484"
email_receiver = "kubrak.ivan@gmail.com"


sovtes_auth_data = {
    "login": os.getenv("SOVTES_LOGIN"),
    "password": os.getenv("SOVTES_PASSWORD")
}

sovtes_static_token = os.getenv("SOVTES_STATIC_TOKEN")

API_KEY_OPENAI = os.getenv("API_KEY_OPENAI")

RUPTELA_API_KEY = os.getenv("RUPTELA_API_KEY")

# YouScore API Configuration
YOUSCORE_API_TOKEN = os.getenv("YOUSCORE_API_TOKEN", "f95c0000d8dfa560d738e552db034d993a822fd4")
