import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Award, Heart } from 'lucide-react';

const AboutPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About <span className="text-primary">InterviewAce</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're revolutionizing interview preparation with AI-powered tools that help candidates 
            build confidence, improve skills, and land their dream jobs.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                To democratize access to high-quality interview preparation by making 
                professional-grade coaching tools available to everyone, regardless of 
                their background or location.
              </p>
              <p className="text-lg text-muted-foreground">
                We believe that with the right preparation and practice, anyone can 
                succeed in their career journey. Our AI-powered platform provides 
                personalized coaching that adapts to your unique needs and goals.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                  <Target className="w-32 h-32 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Accessibility</h3>
                <p className="text-muted-foreground">
                  Making quality interview preparation available to everyone
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Excellence</h3>
                <p className="text-muted-foreground">
                  Delivering the highest quality AI-powered coaching tools
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Award className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                <p className="text-muted-foreground">
                  Continuously improving with cutting-edge technology
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Empathy</h3>
                <p className="text-muted-foreground">
                  Understanding and supporting your career journey
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">Our Story</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="text-center text-xl leading-relaxed">
                InterviewAce was born from a simple observation: traditional interview 
                preparation methods weren't keeping up with the modern job market. 
                Founders experienced the frustration of inadequate preparation tools 
                firsthand and decided to build something better.
              </p>
              <div className="mt-8 grid md:grid-cols-2 gap-8 text-base">
                <div>
                  <p>
                    Our team of engineers, designers, and career coaches came together 
                    with a shared vision: to create an AI-powered platform that could 
                    provide personalized, effective interview coaching at scale.
                  </p>
                </div>
                <div>
                  <p>
                    Today, we're proud to serve thousands of job seekers worldwide, 
                    helping them build confidence and achieve their career goals 
                    through innovative technology and thoughtful design.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-12">Making an Impact</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50,000+</div>
              <p className="text-muted-foreground">Interview Sessions Completed</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">85%</div>
              <p className="text-muted-foreground">Success Rate Improvement</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100+</div>
              <p className="text-muted-foreground">Companies Supported</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AboutPage;