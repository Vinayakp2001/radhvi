# gift/widgets.py
"""
Custom Django Admin Widgets
"""

from django import forms
from django.utils.safestring import mark_safe


class IconifyIconWidget(forms.TextInput):
    """
    Custom widget for selecting Iconify icons with a visual picker
    """
    
    def __init__(self, attrs=None):
        default_attrs = {'class': 'iconify-icon-input', 'placeholder': 'e.g., mdi:gift'}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(attrs=default_attrs)
    
    def render(self, name, value, attrs=None, renderer=None):
        # Get the standard text input
        text_input = super().render(name, value, attrs, renderer)
        
        # Add icon picker button and preview
        icon_picker_html = f'''
        <div class="iconify-picker-wrapper">
            {text_input}
            <button type="button" class="iconify-picker-btn" onclick="openIconPicker('{attrs.get('id', name)}')">
                <span class="iconify" data-icon="mdi:magnify"></span>
                Choose Icon
            </button>
            <div class="iconify-preview">
                <span class="iconify preview-icon" data-icon="{value or 'mdi:help-circle'}" style="font-size: 32px;"></span>
            </div>
        </div>
        
        <style>
        .iconify-picker-wrapper {{
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }}
        
        .iconify-icon-input {{
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
        }}
        
        .iconify-picker-btn {{
            padding: 8px 16px;
            background: #417690;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            white-space: nowrap;
        }}
        
        .iconify-picker-btn:hover {{
            background: #2e5266;
        }}
        
        .iconify-preview {{
            padding: 8px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 60px;
            min-height: 60px;
        }}
        
        .preview-icon {{
            color: #417690;
        }}
        </style>
        '''
        
        return mark_safe(icon_picker_html)
    
    class Media:
        js = (
            'https://code.iconify.design/2/2.2.1/iconify.min.js',
            'js/admin/iconify-picker.js',
        )
        css = {
            'all': ('css/admin/iconify-picker.css',)
        }
