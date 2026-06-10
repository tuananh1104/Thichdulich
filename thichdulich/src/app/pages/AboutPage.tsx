"use client";

import { useLanguage } from '../i18n/LanguageContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Card, CardContent } from '../components/ui/card';
import { Award, Users, Globe, Heart, Shield, Star } from 'lucide-react';

export function AboutPage() {
  const { language } = useLanguage();

  const stats = [
    { icon: Users, value: '50,000+', label: language === 'vi' ? 'Khách Hàng' : 'Customers' },
    { icon: Globe, value: '100+', label: language === 'vi' ? 'Điểm Đến' : 'Destinations' },
    { icon: Award, value: '15+', label: language === 'vi' ? 'Năm Kinh Nghiệm' : 'Years Experience' },
    { icon: Star, value: '4.9/5', label: language === 'vi' ? 'Đánh Giá' : 'Rating' },
  ];

  const values = [
    {
      icon: Heart,
      title: language === 'vi' ? 'Tận Tâm Phục Vụ' : 'Dedicated Service',
      description: language === 'vi' 
        ? 'Chúng tôi luôn đặt sự hài lòng của khách hàng lên hàng đầu với dịch vụ chuyên nghiệp và tận tâm.'
        : 'We always put customer satisfaction first with professional and dedicated service.',
    },
    {
      icon: Shield,
      title: language === 'vi' ? 'An Toàn & Tin Cậy' : 'Safe & Reliable',
      description: language === 'vi'
        ? 'Đảm bảo an toàn tuyệt đối cho mọi chuyến đi với đội ngũ hướng dẫn viên giàu kinh nghiệm.'
        : 'Ensuring absolute safety for every trip with experienced tour guides.',
    },
    {
      icon: Award,
      title: language === 'vi' ? 'Chất Lượng Hàng Đầu' : 'Top Quality',
      description: language === 'vi'
        ? 'Cam kết mang đến những trải nghiệm du lịch chất lượng cao với giá cả hợp lý nhất.'
        : 'Committed to providing high-quality travel experiences at the most reasonable prices.',
    },
  ];

  const team = [
    {
      name: language === 'vi' ? 'Nguyễn Văn An' : 'An Nguyen',
      position: language === 'vi' ? 'Giám Đốc Điều Hành' : 'CEO',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    },
    {
      name: language === 'vi' ? 'Trần Thị Bình' : 'Binh Tran',
      position: language === 'vi' ? 'Giám Đốc Tour' : 'Tour Director',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    },
    {
      name: language === 'vi' ? 'Lê Minh Cường' : 'Cuong Le',
      position: language === 'vi' ? 'Trưởng Phòng Marketing' : 'Marketing Manager',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1708352549266-d8e6d73e1e59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtJTIwdG91cmlzbSUyMHRlYW0lMjBvZmZpY2V8ZW58MXx8fHwxNzc0MTg5NDYzfDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="About Us"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,20,60,0.75) 0%, rgba(0,50,120,0.5) 50%, rgba(0,0,0,0.3) 100%)' }} />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-4">
            {language === 'vi' ? 'Về Chúng Tôi' : 'About Us'}
          </h1>
          <p className="text-white/95 text-xl md:text-2xl">
            {language === 'vi' 
              ? 'Đồng hành cùng bạn khám phá vẻ đẹp Việt Nam'
              : 'Accompanying you to discover the beauty of Vietnam'}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {language === 'vi' ? 'Câu Chuyện Của Chúng Tôi' : 'Our Story'}
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                {language === 'vi'
                  ? 'Thích Du Lịch được thành lập với sứ mệnh mang đến những trải nghiệm du lịch tuyệt vời nhất cho du khách trong và ngoài nước. Chúng tôi tự hào là nền tảng đặt tour uy tín, kết nối hành trình khám phá Việt Nam.'
                  : 'Thichdulich was founded with the mission to bring the best travel experiences to domestic and international tourists. We are proud to be a trusted platform for discovering and booking tours across Vietnam.'}
              </p>
              <p>
                {language === 'vi'
                  ? 'Chúng tôi không chỉ đơn thuần là một công ty du lịch, mà còn là người bạn đồng hành đáng tin cậy của bạn trong mọi hành trình khám phá. Đội ngũ nhân viên chuyên nghiệp, tận tâm và giàu kinh nghiệm của chúng tôi luôn sẵn sàng phục vụ và tạo nên những kỷ niệm đáng nhớ cho mọi chuyến đi.'
                  : 'We are not just a travel company, but a reliable companion on your journey of discovery. Our professional, dedicated, and experienced staff is always ready to serve and create memorable experiences for every trip.'}
              </p>
              <p>
                {language === 'vi'
                  ? 'Với mạng lưới đối tác rộng khắp cả nước, Thích Du Lịch cam kết mang đến cho bạn những dịch vụ du lịch chất lượng cao với giá cả cạnh tranh nhất.'
                  : 'With a nationwide partner network, Thichdulich is committed to providing you with high-quality travel services at competitive prices.'}
              </p>
            </div>
          </div>
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1678583533687-d022e975b18e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b21lciUyMHNlcnZpY2UlMjB0cmF2ZWwlMjBhZ2VudHxlbnwxfHx8fDE3NzQxODk0NjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Our Story"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {language === 'vi' ? 'Giá Trị Cốt Lõi' : 'Core Values'}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {language === 'vi'
                ? 'Những giá trị mà chúng tôi luôn hướng tới trong mọi hoạt động'
                : 'The values we always strive for in all our activities'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-2 hover:border-accent hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {language === 'vi' ? 'Đội Ngũ Lãnh Đạo' : 'Leadership Team'}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {language === 'vi'
              ? 'Những con người đứng sau thành công của Thích Du Lịch'
              : 'The people behind Thichdulich\'s success'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all group">
              <div className="relative h-80 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                  <p className="text-white/90">{member.position}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            {language === 'vi' 
              ? 'Sẵn Sàng Khám Phá Việt Nam Cùng Chúng Tôi?' 
              : 'Ready to Explore Vietnam With Us?'}
          </h2>
          <p className="text-white/90 text-lg mb-8">
            {language === 'vi'
              ? 'Hãy để chúng tôi biến chuyến đi của bạn thành những kỷ niệm khó quên'
              : 'Let us turn your trip into unforgettable memories'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/destinations" className="inline-block">
              <button className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition-all">
                {language === 'vi' ? 'Xem Điểm Đến' : 'View Destinations'}
              </button>
            </a>
            <a href="/contact" className="inline-block">
              <button className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg shadow-lg transition-all">
                {language === 'vi' ? 'Liên Hệ Ngay' : 'Contact Us'}
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}