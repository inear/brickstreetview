import webapp2

class App(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.write('Hello, World!')


class IndexHandler(webapp2.RequestHandler):
    def head(self, url=None):
        pass
    def get(self, url=None):
        #Hackersafe :D

        self.template = '/static/index.html'

class NotFoundHandler(webapp2.RequestHandler):
    def get(self):
        self.response.set_status(404, "Not Found")
        self.template = '404.html'


app = webapp2.WSGIApplication([
    (r'/', IndexHandler),
    (r'/.+', NotFoundHandler)  # must be routed last
], debug=True)
