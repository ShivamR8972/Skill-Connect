from rest_framework import serializers
from .models import RecruiterProfile, FreelancerProfile, Skill, Notification, Review, Testimonial


class RecruiterProfileSerializer(serializers.ModelSerializer):

    company_logo = serializers.ImageField(read_only=True) 
    company_logo_upload = serializers.ImageField(write_only=True, required=False)

    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = RecruiterProfile
        fields = [
            "company_name", "company_website", "location", "about", 
            "industry", "email", "phone", "linkedin_url", 
            "company_logo", "company_logo_upload", "average_rating", "user_id"
        ]

    def update(self, instance, validated_data):
        new_logo = validated_data.pop('company_logo_upload', None)
        if new_logo:
            instance.company_logo = new_logo
        return super().update(instance, validated_data)


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name"]


class FreelancerProfileSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), many=True, write_only=True, source="skills"
    )
    experience_display = serializers.CharField(source="get_experience_display", read_only=True)
    availability_display = serializers.CharField(source="get_availability_display", read_only=True)
    
    resume = serializers.FileField(read_only=True) 
    profilepic = serializers.ImageField(read_only=True)

    resume_upload = serializers.FileField(write_only=True, required=False)
    profilepic_upload = serializers.ImageField(write_only=True, required=False)
    
    profilepic_url = serializers.SerializerMethodField()

    user_id = serializers.IntegerField(source='user.id', read_only=True)


    class Meta:
        model = FreelancerProfile
        fields = [
            "name","dob","education", "experience", "experience_display", 
            "skills", "skill_ids", "portfolio_url", "resume", "resume_upload",
            "email", "phone", "location", "github_url", "linkedin_url", 
            "expected_salary", "availability", "availability_display",
            "profilepic", "profilepic_upload", "profilepic_url", "average_rating", "user_id"
        ]
    
    def get_profilepic_url(self,obj):
        request = self.context.get("request")

        if obj.profilepic and request:
            return request.build_absolute_uri(obj.profilepic.url)
        return None
        
    def update(self, instance, validated_data):
        new_resume = validated_data.pop('resume_upload', None)
        if new_resume:
            instance.resume = new_resume
        
        new_profilepic = validated_data.pop('profilepic_upload', None)
        if new_profilepic:
            instance.profilepic = new_profilepic
        
        return super().update(instance, validated_data)
    

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "message", "is_read", "created_at", "link"]

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'job', 'reviewer', 'reviewee', 'rating', 'comment', 'created_at', 'reviewer_name']
        read_only_fields = ['reviewer', 'created_at', 'reviewer_name']

    def validate(self, data):
        if data['reviewee'] == self.context['request'].user:
            raise serializers.ValidationError("You cannot review yourself.")
        return data
    
    def get_reviewer_name(self, obj):
        reviewer = obj.reviewer
        
        if reviewer.role == 'recruiter':
            return getattr(reviewer.recruiter_profile, 'company_name', reviewer.username)
        
        elif reviewer.role == 'freelancer':
            return getattr(reviewer.freelancer_profile, 'name', reviewer.username)
            
        return reviewer.username

class CompanyListSerializer(serializers.ModelSerializer):
    company_logo_url = serializers.CharField(source='company_logo.url', read_only=True)
    
    class Meta:
        model = RecruiterProfile
        fields = ['company_name', 'industry', 'location', 'company_logo_url']

class TopFreelancerSerializer(serializers.ModelSerializer):
    profilepic_url = serializers.CharField(source='profilepic.url', read_only=True)
    average_rating = serializers.FloatField(source='avg_rating', read_only=True)
    experience_display = serializers.CharField(source="get_experience_display", read_only=True)
    
    class Meta:
        model = FreelancerProfile
        fields = ['name', 'experience_display', 'profilepic_url', 'average_rating']

class TestimonialSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_title = serializers.SerializerMethodField()
    user_pic_url = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = ['id', 'content', 'user_name', 'user_title', 'user_pic_url']

    def get_user_name(self, obj):
        if obj.user.role == 'freelancer':
            return getattr(obj.user.freelancer_profile, 'name', obj.user.username)
        elif obj.user.role == 'recruiter':
            return getattr(obj.user.recruiter_profile, 'company_name', obj.user.username)
        return obj.user.username

    def get_user_title(self, obj):
        if obj.user.role == 'freelancer':
            return obj.user.freelancer_profile.get_experience_display() if hasattr(obj.user, 'freelancer_profile') else 'Freelancer'
        elif obj.user.role == 'recruiter':
            return getattr(obj.user.recruiter_profile, 'industry', 'Recruiter')
        return 'SkillConnect User'

    def get_user_pic_url(self, obj):
        request = self.context.get('request')
        pic_url = None
        if obj.user.role == 'freelancer' and hasattr(obj.user, 'freelancer_profile') and obj.user.freelancer_profile.profilepic:
            pic_url = obj.user.freelancer_profile.profilepic.url
        elif obj.user.role == 'recruiter' and hasattr(obj.user, 'recruiter_profile') and obj.user.recruiter_profile.company_logo:
            pic_url = obj.user.recruiter_profile.company_logo.url
        
        if pic_url and request:
            return request.build_absolute_uri(pic_url)
        return None