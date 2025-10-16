from django.contrib import admin
from .models import RecruiterProfile, FreelancerProfile, Review, Testimonial

@admin.register(RecruiterProfile)
class RecruiterProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "company_name")
    search_fields = ("user__email", "company_name")

@admin.register(FreelancerProfile)
class FreelancerProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user")
    search_fields = ("user__email","skills__name")

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id","job")
    search_fields = ("id",)

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('user', 'content', 'is_approved', 'created_at')
    list_filter = ('is_approved',)
    list_editable = ('is_approved',)
    search_fields = ('user__username', 'content')