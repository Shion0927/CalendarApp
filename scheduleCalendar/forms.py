from django import forms

class CalendarForm(forms.Form):

    start_date = forms.DateTimeField(required=True)
    end_date = forms.DateTimeField(required=True)

class EventForm(forms.Form):
    start_date = forms.CharField(required=True)
    end_date = forms.CharField(required=True)
    event_name = forms.CharField(required=True, max_length=32)
    event_description = forms.CharField(required=True, max_length=1000)

class UpdateForm(forms.Form):
    event_id = forms.IntegerField(required=True)
    edit_event_start_date = forms.CharField(required=True)
    edit_event_end_date = forms.CharField(required=True)
    edit_event_name = forms.CharField(required=True, max_length=32)
    edit_event_description = forms.CharField(required=True, max_length=1000)