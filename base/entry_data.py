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

# Data for GMAIL kubrak.ivan@gmail.com
# Google api key
# api_key = "AIzaSyBAln5inkk7DW3KnHzsHIJXd2O6o1ypLO4" # for kubrak.ivan GMAIL
# email_sender = "kubrak.ivan@gmail.com"
# gmail_password = "mxne kjoe gfln jekl" # for kubrak.ivan GMAIL

api_key = os.getenv("GOOGLE_API_KEY") # for ivan.kubrak.eu GMAIL

# data for message and email sending
phone = "+380504186484"
email_sender = os.getenv("EMAIL_SENDER")
gmail_password = os.getenv("GMAIL_PASSWORD") # for ivan.kubrak.eu GMAIL
email_receiver = "kubrak.ivan@gmail.com"
whatsup_group_id = "BK9oJGFfmFK8vOP7ZjcYhD"

# list of routs to collect information for
list_of_routs = [
    {"onloading_country": "CZ",
     "offloading_country": "IT"},
    {"onloading_country": "IT",
     "offloading_country": "CZ"},
    {"onloading_country": "CZ",
     "offloading_country": "ES"},
    {"onloading_country": "ES",
     "offloading_country": "CZ"},
    {"onloading_country": "IT",
     "offloading_country": "ES"},
    {"onloading_country": "ES",
     "offloading_country": "IT"},
    {"onloading_country": "IT",
     "offloading_country": "DE"},
    {"onloading_country": "DE",
     "offloading_country": "IT"},
    {"onloading_country": "CZ",
     "offloading_country": "DE"},
    {"onloading_country": "DE",
     "offloading_country": "CZ"},
]

# sovtes_auth_data = {
#     "login": "kubrak.i@agromat.ua",
#     "password": "ZZ159159"
# }

sovtes_auth_data = {
    "login": os.getenv("SOVTES_LOGIN"),
    "password": os.getenv("SOVTES_PASSWORD")
}

sovtes_static_token = os.getenv("SOVTES_STATIC_TOKEN")

API_KEY_OPENAI = os.getenv("API_KEY_OPENAI")

RUPTELA_API_KEY = os.getenv("RUPTELA_API_KEY")