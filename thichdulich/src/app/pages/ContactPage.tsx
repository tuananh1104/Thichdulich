"use client";

import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiErrorMessage } from '@/services/api';

export function ContactPage() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.sendContactMessage(formData);
      toast.success(
        language === 'vi' 
          ? 'Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm nhất.' 
          : 'Thank you! We will contact you soon.'
      );
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, language === 'vi' ? 'Không thể gửi tin nhắn' : 'Could not send message'));
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: language === 'vi' ? 'Địa Chỉ' : 'Address',
      content: language === 'vi' 
        ? '123 Đường Lê Lợi, Quận 1, TP.HCM, Việt Nam'
        : '123 Le Loi Street, District 1, Ho Chi Minh City, Vietnam',
      link: 'https://maps.google.com',
    },
    {
      icon: Phone,
      title: language === 'vi' ? 'Điện Thoại' : 'Phone',
      content: '+84 123 456 789',
      link: 'tel:+84123456789',
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'info@thichdulich.vn',
      link: 'mailto:info@thichdulich.vn',
    },
    {
      icon: Clock,
      title: language === 'vi' ? 'Giờ Làm Việc' : 'Working Hours',
      content: language === 'vi' 
        ? 'Thứ 2 - Chủ Nhật: 8:00 - 20:00'
        : 'Mon - Sun: 8:00 AM - 8:00 PM',
      link: null,
    },
  ];

  const offices = [
    {
      city: language === 'vi' ? 'Hà Nội' : 'Hanoi',
      address: language === 'vi' 
        ? '456 Đường Hoàn Kiếm, Quận Hoàn Kiếm, Hà Nội'
        : '456 Hoan Kiem Street, Hoan Kiem District, Hanoi',
      phone: '+84 987 654 321',
      image: 'https://images.unsplash.com/photo-1653279594700-832fe2310a82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtJTIwaHVlJTIwaW1wZXJpYWwlMjBjaXR5fGVufDF8fHx8MTc3NDE4OTQ2NXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      city: language === 'vi' ? 'Đà Nẵng' : 'Da Nang',
      address: language === 'vi'
        ? '789 Đường Trần Phú, Quận Hải Châu, Đà Nẵng'
        : '789 Tran Phu Street, Hai Chau District, Da Nang',
      phone: '+84 912 345 678',
      image: 'https://images.unsplash.com/photo-1643030080539-b411caf44c37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2klMjBhbiUyMGFuY2llbnQlMjB0b3duJTIwdmlldG5hbXxlbnwxfHx8fDE3NzQxODkwODd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1678583533687-d022e975b18e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b21lciUyMHNlcnZpY2UlMjB0cmF2ZWwlMjBhZ2VudHxlbnwxfHx8fDE3NzQxODk0NjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Contact"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,20,60,0.75) 0%, rgba(0,50,120,0.5) 50%, rgba(0,0,0,0.3) 100%)' }} />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-4">
            {language === 'vi' ? 'Liên Hệ' : 'Contact Us'}
          </h1>
          <p className="text-white/95 text-xl">
            {language === 'vi' 
              ? 'Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7'
              : 'We are always ready to support you 24/7'}
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <info.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{info.title}</h3>
                  {info.link ? (
                    <a 
                      href={info.link} 
                      className="text-gray-600 hover:text-accent transition-colors text-sm"
                    >
                      {info.content}
                    </a>
                  ) : (
                    <p className="text-gray-600 text-sm">{info.content}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {language === 'vi' ? 'Gửi Tin Nhắn' : 'Send Message'}
            </h2>
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {language === 'vi' ? 'Họ Tên' : 'Full Name'} *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder={language === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {language === 'vi' ? 'Số Điện Thoại' : 'Phone'} *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="0901234567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      {language === 'vi' ? 'Tiêu Đề' : 'Subject'} *
                    </Label>
                    <Input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      placeholder={language === 'vi' ? 'Tôi muốn hỏi về...' : 'I want to ask about...'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      {language === 'vi' ? 'Nội Dung' : 'Message'} *
                    </Label>
                    <textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      placeholder={language === 'vi' ? 'Nhập nội dung tin nhắn...' : 'Enter your message...'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                    disabled={loading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading 
                      ? (language === 'vi' ? 'Đang gửi...' : 'Sending...') 
                      : (language === 'vi' ? 'Gửi Tin Nhắn' : 'Send Message')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Map & Social */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {language === 'vi' ? 'Văn Phòng Chính' : 'Main Office'}
              </h2>
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="h-[400px] bg-gray-200">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3252214081624!2d106.69638931533491!3d10.782432792318482!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3330bcc9%3A0xb3ff69197b10ec4f!2zVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </Card>
            </div>

            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {language === 'vi' ? 'Theo Dõi Chúng Tôi' : 'Follow Us'}
                </h3>
                <div className="flex gap-4">
                  <a 
                    href="#" 
                    className="w-12 h-12 bg-primary hover:bg-accent rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                  >
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                  <a 
                    href="#" 
                    className="w-12 h-12 bg-primary hover:bg-accent rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                  >
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                  <a 
                    href="#" 
                    className="w-12 h-12 bg-primary hover:bg-accent rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                  >
                    <Youtube className="w-5 h-5 text-white" />
                  </a>
                  <a 
                    href="#" 
                    className="w-12 h-12 bg-primary hover:bg-accent rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                  >
                    <Twitter className="w-5 h-5 text-white" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Other Offices */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {language === 'vi' ? 'Văn Phòng Khác' : 'Other Offices'}
            </h2>
            <p className="text-gray-600 text-lg">
              {language === 'vi'
                ? 'Hệ thống văn phòng trên toàn quốc'
                : 'Nationwide office network'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {offices.map((office, index) => (
              <Card key={index} className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all group">
                <div className="relative h-48">
                  <img
                    src={office.image}
                    alt={office.city}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white">{office.city}</h3>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <p className="text-gray-600 text-sm">{office.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                      <a href={`tel:${office.phone}`} className="text-gray-600 text-sm hover:text-accent transition-colors">
                        {office.phone}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
