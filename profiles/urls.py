from django.urls import path
from .views import (MeRecruiterProfileView, MeFreelancerProfileView, SkillListView, MyNotificationsView, MarkNotificationReadView, 
                    ReviewCreateView, UserReviewsListView, CompanyListView, TopFreelancersListView, TestimonialCreateView, TestimonialListView, ChatbotAPIView)

urlpatterns = [
    path("profile/recruiter/me/", MeRecruiterProfileView.as_view(), name="recruiter_profile_me"),
    path("profile/freelancer/me/", MeFreelancerProfileView.as_view(), name="freelancer_profile_me"),
    path("skills/", SkillListView.as_view(), name="skills"),
    path("notifications/", MyNotificationsView.as_view(), name="my-notifications"),
    path("notifications/<int:pk>/read/", MarkNotificationReadView.as_view(), name="mark-notification-read"),
    path("reviews/", ReviewCreateView.as_view(), name="create-review"),
    path("user/<int:user_pk>/reviews/", UserReviewsListView.as_view(), name="user-reviews-list"),
    path("companies/", CompanyListView.as_view(),name = "company-list"),
    path("top-freelancers/", TopFreelancersListView.as_view(), name="top-freelancers-list"),
    path("testimonials/", TestimonialListView.as_view(), name="testimonial-list"),
    path("testimonials/submit/", TestimonialCreateView.as_view(), name="testimonial-submit"),
    path("chatbot/", ChatbotAPIView.as_view(), name="chatbot-api"),
]
