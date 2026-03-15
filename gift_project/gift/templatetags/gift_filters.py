# gift/templatetags/gift_filters.py

from django import template
from django.contrib.humanize.templatetags.humanize import intcomma
import math

register = template.Library()

@register.filter
def multiply(value, arg):
    """Multiply value by arg"""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return 0

@register.filter
def divide(value, arg):
    """Divide value by arg"""
    try:
        return float(value) / float(arg)
    except (ValueError, TypeError, ZeroDivisionError):
        return 0

@register.filter
def subtract(value, arg):
    """Subtract arg from value"""
    try:
        return float(value) - float(arg)
    except (ValueError, TypeError):
        return 0

@register.filter
def add(value, arg):
    """Add arg to value"""
    try:
        return float(value) + float(arg)
    except (ValueError, TypeError):
        return 0

@register.filter
def percentage(value, arg):
    """Calculate percentage"""
    try:
        return (float(value) / float(arg)) * 100
    except (ValueError, TypeError, ZeroDivisionError):
        return 0

@register.filter
def format_price(value):
    """Format price with commas"""
    try:
        return f"₹{intcomma(int(value))}"
    except (ValueError, TypeError):
        return f"₹0"

@register.filter
def stars(value):
    """Generate star rating HTML"""
    try:
        rating = float(value)
        full_stars = math.floor(rating)
        half_star = 1 if rating - full_stars >= 0.5 else 0
        empty_stars = 5 - full_stars - half_star
        
        stars_html = ''
        stars_html += '<i class="fas fa-star"></i>' * full_stars
        if half_star:
            stars_html += '<i class="fas fa-star-half-alt"></i>'
        stars_html += '<i class="far fa-star"></i>' * empty_stars
        
        return stars_html
    except (ValueError, TypeError):
        return '<i class="far fa-star"></i>' * 5

@register.filter
def get_category(categories, slug):
    """Get category name from slug"""
    try:
        return categories.get(slug=slug).name
    except:
        return ""

@register.filter
def get_brand(brands, slug):
    """Get brand name from slug"""
    try:
        return brands.get(slug=slug).name
    except:
        return ""

@register.filter
def truncatechars(value, arg):
    """Truncate characters with ellipsis"""
    try:
        if len(value) > int(arg):
            return value[:int(arg)] + "..."
        return value
    except (ValueError, TypeError):
        return value

@register.filter
def get_range(value):
    """Generate range for template loops"""
    return range(1, value + 1)

@register.filter
def get_item(dictionary, key):
    """Get item from dictionary"""
    return dictionary.get(key, "")