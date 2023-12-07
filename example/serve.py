from http.server import SimpleHTTPRequestHandler
import socketserver
import os

# Set the directory containing your HTML pages
html_directory = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'html_pages')

# Global variable to check login status
is_logged_in = False

class CustomHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        global is_logged_in

        if self.path == '/':
            # Redirect to login.html by default
            self.path = '/login.html'

        elif self.path == '/login' and self.command == 'POST':
            # Handle login form submission
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            # Check login credentials (you need to implement your own logic here)
            if check_login_credentials(post_data):
                is_logged_in = True
                # Redirect to the root path after successful login
                self.send_response(303)
                self.send_header('Location', '/home.html')
                self.end_headers()
                return
            else:
                # Redirect back to login if login fails
                self.path = '/login.html'

        # Call the base class method to do the standard GET handling
        return SimpleHTTPRequestHandler.do_GET(self)

def check_login_credentials(post_data):
    # Implement your own logic to check login credentials
    # For example, compare with hardcoded username and password
    # Note: This is just a placeholder and not secure. You should implement a secure login mechanism.
    username, password = map(lambda x: x.split('=')[1], post_data.split('&'))
    return username == 'Admin' and password == 'your_password'

# Set up the server
port = 8000
handler = CustomHandler

httpd = socketserver.TCPServer(("", port), handler)

print(f"Serving on http://localhost:{port}")
httpd.serve_forever()
