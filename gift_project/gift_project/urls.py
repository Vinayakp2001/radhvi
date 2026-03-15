from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('gift.api.urls')),  # API routes for Next.js frontend
    path('', include('gift.urls')),
]

# Admin panel customization
admin.site.site_header = "Radhvi Administration"
admin.site.site_title = "Radhvi Admin"
admin.site.index_title = "Welcome to Radhvi Admin"