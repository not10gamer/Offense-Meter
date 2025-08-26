import os
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)

# Configure the generative AI model
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables.")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash-lite')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    text_to_analyze = data.get('text')

    if not text_to_analyze:
        return jsonify({'error': 'No text provided for analysis.'}), 400

    try:
        # Construct a detailed prompt for the AI
        prompt = (
            f"Analyze the following text for sensitive content across several categories. "
            f"Your goal is to identify and score the text, not to generate offensive content. "
            f"Provide a JSON response with scores and brief, neutral, and analytical reasons for each score. "
            f"The JSON object should have the following structure: "
            f"{{ "
            f"  'racism': {{ 'ai_score': <number>, 'potential_score': <number>, 'reason': '<string>' }}, "
            f"  'sexism': {{ 'ai_score': <number>, 'potential_score': <number>, 'reason': '<string>' }}, "
            f"  'homophobia': {{ 'ai_score': <number>, 'potential_score': <number>, 'reason': '<string>' }}, "
            f"  'religious_blasphemy': {{ 'ai_score': <number>, 'potential_score': <number>, 'reason': '<string>' }}, "
            f"  'other_minorities': [ {{ 'group': '<string>', 'ai_score': <number>, 'potential_score': <number>, 'reason': '<string>' }} ], "
            f"  'shaming_line': '<string>', "
            f"  'probability_beaten_up': <number>, "
            f"  'probability_cancelled': <number>, "
            f"  'probability_parental_disapproval': <number>, "
            f"  'history_summary': '<string>', "
            f"  'conversational_reception_score': <number> "
            f"}}. "
            f"Scores should be from 0 to 100. 'ai_score' is the direct offensiveness, and 'potential_score' is how it could be misinterpreted. "
            f"'shaming_line' should be a witty, slightly shaming comment about the input text. "
            f"'probability_beaten_up', 'probability_cancelled', and 'probability_parental_disapproval' are satirical percentages. "
            f"'history_summary' is a very brief summary for the history view. "
            f"'conversational_reception_score' is a score from 0-100 on how well the text would be received. "
            f"Text to analyze: \"{text_to_analyze}\""
        )

        # Generate content using the AI model
        response = model.generate_content(prompt)
        
        # Extract and parse the JSON from the response
        text = response.text
        # Extract JSON from the response, handling markdown code blocks
        if '```json' in text:
            json_str = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text and '{' in text:
            json_str = text.split('```')[1].split('```')[0].strip()
        else:
            # Fallback for plain JSON
            start_index = text.find('{')
            end_index = text.rfind('}') + 1
            if start_index != -1 and end_index > start_index:
                json_str = text[start_index:end_index]
            else:
                raise ValueError("No JSON object found in the response from the model.")
        
        analysis_result = json.loads(json_str)

        return jsonify(analysis_result)

    except Exception as e:
        error_message = f"An error occurred: {str(e)}"
        print(f"Error during analysis: {error_message}")
        return jsonify({'error': error_message}), 500

if __name__ == '__main__':
    app.run(debug=True)
