from web import web_app
port = 5000 # replace 5000 with your preference
web_app.run(host='0.0.0.0', port=port, threaded=True, use_reloader=False)