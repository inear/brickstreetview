#!/usr/bin/env python
#
from __future__ import with_statement
import os, urllib2, re, base64
import json
import datetime
from google.appengine.api import users, images, files
from google.appengine.ext import blobstore, db, webapp, ndb
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template

import webapp2

class Share(ndb.Model):

  location = ndb.StringProperty()
  pano_id = ndb.StringProperty()
  desc = ndb.StringProperty()
  served = ndb.IntegerProperty()
  lastTimeServed = ndb.DateTimeProperty(auto_now_add=False)
  date = ndb.DateTimeProperty(auto_now_add=True)

class IndexHandler(webapp2.RequestHandler):
    def head(self, url=None):
        pass
    def get(self, url=None):

        #user = users.get_current_user()
        template_values = {
        }

        #if user:
        path = 'static/index.html'
        self.response.out.write(template.render(path, template_values));
        #else:
        #    self.redirect(users.create_login_url(self.request.uri))


class NotFoundHandler(webapp2.RequestHandler):
    def get(self):
        self.response.set_status(404, "Not Found")
        self.template = '404.html'


class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):

    def options(self):
        self.response.headers['Access-Control-Allow-Origin'] = 'http://brickstreetview.com'
        self.response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
        self.response.headers['Access-Control-Allow-Methods'] = 'POST, GET, PUT, DELETE'

    def post(self):
        self.response.headers["Access-Control-Allow-Origin"] = "http://brickstreetview.com"
        self.response.headers['Content-Type'] = 'application/json'

        try:
            data = json.loads(self.request.body)
            img_data = data['imgdata']

            data_to_64 = re.search(r'base64,(.*)', img_data).group(1)
            #data_to_64 = re.search(r'base64,(.*)', data).group(1)
            decoded = data_to_64.decode('base64')

            # Create the file
            file_name = files.blobstore.create(mime_type='image/jpeg')
            # Open the file and write to it
            with files.open(file_name, 'a') as f:
                f.write(decoded)

            # Finalize the file. Do this before attempting to read it.
            files.finalize(file_name)

            key = files.blobstore.get_blob_key(file_name)

            url = 'http://localhost:8080/serve/%s' % key

            #save entity
            share = Share(location = data['location'],
                        served = 0,
                        desc = data['description'],
                        pano_id = data['pano_id'])
            share.key = ndb.Key(Share, str(key))
            share.put()

            self.response.out.write('{ "url": "' + url + '", "key": "%s" }' % key)

        except Exception, e:
            print e

class ServeHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, key):
        if not blobstore.get(key):
            self.error(404)
        else:

            qry = Share.get_by_id(str(key))
            qry.served += 1
            qry.lastTimeServed = datetime.datetime.now()
            qry.put()

            self.send_blob(key)

app = webapp2.WSGIApplication([
    (r'/upload', UploadHandler),
    ('/serve/([^/]+)?', ServeHandler),
    (r'/*.*', IndexHandler)
], debug=True)
