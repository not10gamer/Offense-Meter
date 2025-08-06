import json
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# It's recommended to get the API key from environment variables in production
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables.")

genai.configure(api_key=api_key)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    text = request.json['text']

    prompt = f"""
    Analyze the following text for multiple categories of offense. Your entire response must be a single, valid JSON object, ensuring every requested field is present even if the text is harmless.

    Text: "{text}"

    1.  **Categorical Analysis**:
        -   For each of the main categories ("racism", "sexism", "homophobia", "religious_blasphemy", "parental_disapproval"), you must provide an object with:
            -   `ai_score`: An integer from 0-100. If harmless, this must be 0.
            -   `potential_score`: An integer from 0-100. If harmless, this must be 0.
            -   `reason`: A single, brief explanation. For harmless text, state "This text is not offensive."
        -   Include a key named "other_minorities", an array of objects for any other groups. If none, you must return an empty array [].

    2.  **Summary & Consequences**:
        -   `shaming_line`: A short, witty line. For harmless text, you must provide a positive or neutral comment like "Perfectly fine!" or "A model of inoffensive conversation."
        -   `probability_beaten_up`: An integer from 0-100. Must be 0 for harmless text.
        -   `probability_cancelled`: An integer from 0-100. Must be 0 for harmless text.

    3.  **History & Highlighting**:
        -   `history_summary`: A very short, one-to-ten word summary of the text's theme (e.g., "A simple greeting.").
        -   `conversational_reception_score`: An integer from 0-100 (100 = very well received). For harmless text, this must be 100.
        -   `problematic_words`: An array of the specific words from the text that contributed to offense scores. If none, you must return an empty array [].

    **Formatting Rules**:
    -   All scores and probabilities must be specific integers (e.g., 27, 83, 91, not 25, 80, 90).
    -   The final output must be only the JSON object, with no markdown formatting like ```json.
    """

    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        response = model.generate_content(prompt)

        clean_response_text = response.text.strip().lstrip('```json').rstrip('```')

        data = json.loads(clean_response_text)
        return jsonify(data)

    except json.JSONDecodeError:
        print("Error: Could not parse JSON from model response.")
        return jsonify({"error": "Invalid response from AI model"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

