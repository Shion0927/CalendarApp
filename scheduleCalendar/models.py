from django.db import models

# Create your models here.

class Event(models.Model):
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    event_name = models.CharField(max_length=200)
    description = models.CharField(max_length=1000, null=True)