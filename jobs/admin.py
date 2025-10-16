from django.contrib import admin
from .models import Job, Application

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "recruiter", "pay_per_hour", "created_at", "picture")
    list_filter = ("created_at", "skills")
    search_fields = ("title", "requirements", "recruiter__email", "recruiter__recruiter_profile__company_name")
    filter_horizontal = ("skills",)
    ordering = ("-created_at",)

@admin.register(Application)
class Application(admin.ModelAdmin):
    list_display = ("job", "freelancer", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("job__title", "freelancer__email", "freelancer__freelancer_profile__name")
    autocomplete_fields = ("job", "freelancer")
    ordering = ("-created_at",)