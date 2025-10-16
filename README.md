# Skill Connect

A full-stack web application designed to bridge the gap between skilled freelancers and recruiters. SkillConnect provides a robust platform for posting jobs, hiring talent, and managing professional opportunities.

# Overview

SkillConnect is a dynamic, two-sided marketplace built to facilitate the hiring process in the gig economy. The platform is tailored to the specific needs of two core user groups: Recruiters seeking to hire top talent for their projects, and Freelancers looking for new opportunities.

With a rich feature set including user-specific dashboards, a two-way review system, real-time notifications, and an integrated AI assistant, SkillConnect aims to create a seamless and trustworthy environment for professional collaboration.

# Key Features

Dual User Roles: Separate, feature-rich interfaces for both Recruiters and Freelancers.

Comprehensive Job Management: Recruiters can create, edit, view, and delete job postings.

Advanced Job Search: Freelancers can browse, search, and live-filter job listings by keywords, skills, pay, and work mode.

Application System: Freelancers can apply for jobs with an optional cover letter, and recruiters can manage these applications by updating their status (Reviewed, Accepted, Rejected).

Interactive Dashboards: Personalized dashboards for both user types, featuring charts and key statistics on applications and job postings.

Two-Way Rating & Review System: After a job is marked "Accepted," both parties can rate and review each other to build reputation and trust on the platform.

Automated Notification System: Real-time notifications for both users. Recruiters are alerted to new applications, and freelancers are notified of new jobs that match their skills.

Public Showcase Pages: The homepage dynamically displays user-submitted testimonials and a list of top-rated freelancers to build credibility.

AI Features includes a Google Gemini Powered AI chatbot as well as an AI resume analyzer that the recruiters can use to analyze the applicant resume against the posted job description.

# Technology stack

# Backend:
Framework: Django

API: Django REST Framework

Database: PostgreSQL

# Frontend:
Core: Vanilla JavaScript, HTML5, CSS3

Styling: Tailwind CSS

Data Visualization: Chart.js

# Setup and Installation
To get a local copy up and running, follow these simple steps.

Prerequisites:
Python 3.10+

# Installation

# Clone the Repository:

```Bash

git clone https://github.com/your-username/skillconnect.git

cd skillconnect

```

# Setup The Backend

```Bash

#Create and activate a virtual environment

python -m venv .venv

source .venv/bin/activate  

#On Windows, use: 

.venv\Scripts\activate

#Install Python dependencies

pip install -r requirements.txt

#Create a .env file for your secret keys

#Run database migrations

python manage.py migrate

#Start the Django server

python manage.py runserver

```
The backend API will be available at http://127.0.0.1:8000/

# Set up the Frontend:
The frontend is built with vanilla JS and can be run by opening the HTML files directly in a browser or using a simple live server.

Navigate to the frontend/ directory.

If using VS Code, you can use the "Live Server" extension to serve the files.

You can follow the following tutorial to better setup the project

https://youtu.be/EwhMXNXo4o8

# List of APIs:

APIs:

```Bash
POST users/auth/register/ : register as recruiter or freelancer

POST users/auth/login/ : Login and receive JWT access token

POST users/auth/token/refresh/ : Refresh JWT token

GET profiles/profile/recruiter/me/ :  View recruiter profile

PATCH profiles/profile/recruiter/me/ : Update the recruiter profile

GET profiles/profile/freelancer/me/ : View freelancer profile

PATCH profiles/profile/freelancer/me/ : Update the freelancer profile

GET profiles/skills/ : To get a list of all the available skills

GET profiles/notifications/ : To get the notifications for an user

PATCH profiles/notifications<int:pk>/read/ : To mark a notification as read

POST profiles/reviews/ : To review a user i.e. Freelancer or Recruiter

GET profiles/users/<int:user_pk>/reviews/ : To get the reviews of an user

GET profiles/companies/ : To get a list of all the companies registered

GET profiles/top-freelancers/ : To get a list of top 5 freelancers

GET profiles/testimonials/ : To get a list of testimonials

POST profiles/testimonials/submit/ : To post a testimonial that will be reviewed by the admin and then shown on the landing page.

POST jobs/job/create/ : To create a new job posting

GET jobs/job/my/ : To get all the jobs created by a user

GET jobs/job/ : To get a list of all the available jobs 

GET jobs/job/<int:pk>/ : To view the details of a particular job

DELETE jobs/job/<int:pk>/delete/ : To delete a job

PATCH jobs/job/<int:pk>/edit/ : To edit a job

GET jobs/job/recommendations/ : To get job recommendations for a user

POST jobs/application/apply/ : To apply for a job

GET jobs/application/my/ : To get a list of all the applications of a freelancer

GET jobs/application/recruiter/ : To get a list of all the applications for a recruiter

GET jobs/application/<int:pk>/status/ : To get the status of the application

PATCH jobs/applications/<int:pk>/status/ : To change the status of the application

POST profiles/chatbot/ : To access the Chatbot

POST jobs/application/{id}/analyze-resume/ : TO analyze the resume of the apllicant

```
