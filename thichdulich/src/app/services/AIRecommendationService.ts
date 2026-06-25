import type { Tour, Booking } from '../types/domainTypes';
import { DESTINATION_CATALOG } from '../data/destinationCatalog';
import { normalizeText } from '../utils/text';
import { getTourTypeLabel } from '../utils/labels';

export interface UserPreferences {
  favoriteTypes: string[];
  priceRange: [number, number];
  preferredDuration: number[];
  visitedLocations: string[];
  averageRating: number;
  searchHistory?: string[]; // Lịch sử tìm kiếm
  viewedTours?: string[]; // Tour đã xem
  clickedTypes?: Record<string, number>; // Số lần click mỗi loại tour
}

export interface RecommendationResult {
  tour: Tour;
  score: number;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low'; // Độ tin cậy của gợi ý
}

export interface UserInteraction {
  userId: string;
  tourId?: string;
  action: 'view' | 'search' | 'click' | 'bookmark';
  query?: string;
  timestamp: string;
}

export interface TrendingTour {
  tourId: string;
  views: number;
  bookings: number;
  searches: number;
  trendScore: number;
}

export class AIRecommendationService {
  // Local Storage Keys
  private static INTERACTIONS_KEY = 'thichdulich_user_interactions';
  private static TRENDING_KEY = 'thichdulich_trending_tours';
  private static SEARCH_HISTORY_KEY = 'thichdulich_search_history';

  /**
   * Lưu tương tác người dùng
   */
  static saveUserInteraction(interaction: UserInteraction): void {
    try {
      const stored = localStorage.getItem(this.INTERACTIONS_KEY);
      const interactions: UserInteraction[] = stored ? JSON.parse(stored) : [];
      interactions.push(interaction);

      // Chỉ giữ lại 100 interaction gần nhất
      const recentInteractions = interactions.slice(-100);
      localStorage.setItem(this.INTERACTIONS_KEY, JSON.stringify(recentInteractions));

      // Cập nhật trending
      if (interaction.action === 'view' || interaction.action === 'click') {
        this.updateTrendingScores(interaction.tourId!);
      }

      // Lưu lịch sử tìm kiếm
      if (interaction.action === 'search' && interaction.query) {
        this.saveSearchQuery(interaction.query);
      }
    } catch (e) {
      console.error('Failed to save interaction', e);
    }
  }

  /**
   * Lưu query tìm kiếm
   */
  private static saveSearchQuery(query: string): void {
    try {
      const stored = localStorage.getItem(this.SEARCH_HISTORY_KEY);
      const history: string[] = stored ? JSON.parse(stored) : [];

      // Tránh trùng lặp
      const filtered = history.filter(q => q.toLowerCase() !== query.toLowerCase());
      filtered.unshift(query);

      // Chỉ giữ 20 query gần nhất
      const recent = filtered.slice(0, 20);
      localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(recent));
    } catch (e) {
      console.error('Failed to save search query', e);
    }
  }

  /**
   * Lấy lịch sử tìm kiếm
   */
  static getSearchHistory(): string[] {
    try {
      const stored = localStorage.getItem(this.SEARCH_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Lấy tất cả interactions của user
   */
  static getUserInteractions(userId: string): UserInteraction[] {
    try {
      const stored = localStorage.getItem(this.INTERACTIONS_KEY);
      const all: UserInteraction[] = stored ? JSON.parse(stored) : [];
      return all.filter(i => i.userId === userId);
    } catch (e) {
      return [];
    }
  }

  /**
   * Cập nhật điểm trending cho tour
   */
  private static updateTrendingScores(tourId: string): void {
    try {
      const stored = localStorage.getItem(this.TRENDING_KEY);
      const trending: Record<string, TrendingTour> = stored ? JSON.parse(stored) : {};

      if (!trending[tourId]) {
        trending[tourId] = {
          tourId,
          views: 0,
          bookings: 0,
          searches: 0,
          trendScore: 0
        };
      }

      trending[tourId].views += 1;
      trending[tourId].trendScore = this.calculateTrendScore(trending[tourId]);

      localStorage.setItem(this.TRENDING_KEY, JSON.stringify(trending));
    } catch (e) {
      console.error('Failed to update trending', e);
    }
  }

  /**
   * Tính điểm trending
   */
  private static calculateTrendScore(data: TrendingTour): number {
    // Công thức: views * 1 + bookings * 10 + searches * 3
    // Với decay theo thời gian (giả sử mỗi ngày giảm 5%)
    return data.views * 1 + data.bookings * 10 + data.searches * 3;
  }

  /**
   * Lấy tours trending
   */
  static getTrendingTours(allTours: Tour[], limit: number = 8): Tour[] {
    try {
      const stored = localStorage.getItem(this.TRENDING_KEY);
      if (!stored) return allTours.filter(t => t.status === 'approved').slice(0, limit);

      const trending: Record<string, TrendingTour> = JSON.parse(stored);
      const sorted = Object.values(trending)
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, limit);

      return sorted
        .map(t => allTours.find(tour => tour.id === t.tourId))
        .filter(t => t && t.status === 'approved' && t.availability) as Tour[];
    } catch (e) {
      return allTours.filter(t => t.status === 'approved').slice(0, limit);
    }
  }

  /**
   * Phân tích sở thích người dùng từ lịch sử booking VÀ interactions
   */
  static analyzeUserPreferences(bookings: Booking[], allTours: Tour[], userId?: string): UserPreferences {
    // Lấy interactions nếu có userId
    let interactions: UserInteraction[] = [];
    let viewedTours: Tour[] = [];
    let searchHistory: string[] = [];
    let clickedTypes: Record<string, number> = {};

    if (userId) {
      interactions = this.getUserInteractions(userId);
      const viewedTourIds = interactions
        .filter(i => i.action === 'view' || i.action === 'click')
        .map(i => i.tourId)
        .filter(id => id !== undefined) as string[];

      viewedTours = allTours.filter(t => viewedTourIds.includes(t.id));
      searchHistory = this.getSearchHistory();

      // Đếm số lần click theo type
      viewedTours.forEach(tour => {
        clickedTypes[tour.type] = (clickedTypes[tour.type] || 0) + 1;
      });
    }

    // Nếu không có bookings và interactions
    if (bookings.length === 0 && viewedTours.length === 0) {
      return {
        favoriteTypes: [],
        priceRange: [0, 10000000],
        preferredDuration: [],
        visitedLocations: [],
        averageRating: 0,
        searchHistory,
        viewedTours: viewedTours.map(t => t.id),
        clickedTypes
      };
    }

    // Kết hợp tours từ bookings và viewed
    const bookedTours = bookings
      .map(b => allTours.find(t => t.id === b.tourId))
      .filter(t => t !== undefined) as Tour[];

    const allConsideredTours = [...bookedTours, ...viewedTours];

    // Phân tích loại tour yêu thích (ưu tiên bookings hơn views)
    const typeCount: Record<string, number> = {};
    bookedTours.forEach(tour => {
      typeCount[tour.type] = (typeCount[tour.type] || 0) + 5; // Booking có trọng số cao hơn
    });
    viewedTours.forEach(tour => {
      typeCount[tour.type] = (typeCount[tour.type] || 0) + 1;
    });

    const favoriteTypes = Object.entries(typeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    // Phân tích khoảng giá
    const prices = allConsideredTours.map(t => t.price);
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const priceRange: [number, number] = [
        Math.floor(avgPrice * 0.7 / 1000000) * 1000000,
        Math.ceil(avgPrice * 1.5 / 1000000) * 1000000
      ];

      // Thời gian yêu thích
      const durations = allConsideredTours.map(t => t.duration);
      const uniqueDurations = [...new Set(durations)];

      // Địa điểm đã đi
      const visitedLocations = [...new Set(bookedTours.map(t => t.location))]; // Chỉ tính booked

      // Rating trung bình
      const averageRating = allConsideredTours.reduce((sum, t) => sum + t.rating, 0) / allConsideredTours.length;

      return {
        favoriteTypes,
        priceRange,
        preferredDuration: uniqueDurations,
        visitedLocations,
        averageRating,
        searchHistory,
        viewedTours: viewedTours.map(t => t.id),
        clickedTypes
      };
    }

    return {
      favoriteTypes,
      priceRange: [0, 10000000],
      preferredDuration: [],
      visitedLocations: [],
      averageRating: 0,
      searchHistory,
      viewedTours: viewedTours.map(t => t.id),
      clickedTypes
    };
  }

  /**
   * Tính điểm phù hợp của tour với người dùng (cải tiến với confidence)
   */
  static calculateTourScore(
    tour: Tour,
    preferences: UserPreferences,
    userBookings: Booking[]
  ): { score: number; reasons: string[]; confidence: 'high' | 'medium' | 'low' } {
    let score = 0;
    const reasons: string[] = [];
    let confidenceFactors = 0; // Số yếu tố đóng góp vào confidence

    // Đã book tour này rồi → giảm điểm
    if (userBookings.some(b => b.tourId === tour.id)) {
      return { score: -1000, reasons: ['Đã đặt tour này'], confidence: 'low' };
    }

    // Đã xem tour này → bonus nhỏ
    if (preferences.viewedTours?.includes(tour.id)) {
      score += 10;
      reasons.push('Bạn đã quan tâm tour này');
      confidenceFactors += 1;
    }

    // Loại tour yêu thích (+35 điểm) - tăng từ 30
    const typeMatchIndex = preferences.favoriteTypes.indexOf(tour.type);
    if (typeMatchIndex !== -1) {
      const bonus = 35 - (typeMatchIndex * 5); // Top 1: 35, top 2: 30, top 3: 25
      score += bonus;
      reasons.push(`Loại tour "${getTourTypeLabel(tour.type)}" bạn yêu thích`);
      confidenceFactors += 2;
    }

    // Clicked types từ interactions
    if (preferences.clickedTypes && preferences.clickedTypes[tour.type]) {
      const clickBonus = Math.min(preferences.clickedTypes[tour.type] * 3, 15);
      score += clickBonus;
      confidenceFactors += 1;
    }

    // Trong khoảng giá (+25 điểm) - tăng từ 20
    if (tour.price >= preferences.priceRange[0] && tour.price <= preferences.priceRange[1]) {
      score += 25;
      reasons.push('Phù hợp ngân sách của bạn');
      confidenceFactors += 2;
    } else {
      // Nếu gần khoảng giá thì vẫn có điểm nhỏ
      const priceDiff = Math.min(
        Math.abs(tour.price - preferences.priceRange[0]),
        Math.abs(tour.price - preferences.priceRange[1])
      );
      if (priceDiff < 1000000) {
        score += 10;
        confidenceFactors += 1;
      }
    }

    // Thời gian phù hợp (+20 điểm) - tăng từ 15
    if (preferences.preferredDuration.includes(tour.duration)) {
      score += 20;
      reasons.push(`Chuyến đi ${tour.duration} ngày phù hợp`);
      confidenceFactors += 1;
    }

    // Chưa đi địa điểm này (+30 điểm) - tăng từ 25
    if (!preferences.visitedLocations.includes(tour.location)) {
      score += 30;
      reasons.push(`Khám phá ${tour.location} mới lạ`);
      confidenceFactors += 2;
    } else {
      // Đã đi rồi → giảm điểm
      score -= 10;
    }

    // Rating cao (+10-25 điểm) - tăng từ 10-20
    const ratingBonus = Math.floor((tour.rating - 4) * 25);
    if (ratingBonus > 0) {
      score += ratingBonus;
      reasons.push(`${tour.rating}⭐ đánh giá xuất sắc`);
      confidenceFactors += 1;
    }

    // Reviews nhiều (+5-20 điểm) - tăng từ 5-15
    const reviewBonus = Math.min(Math.floor(tour.reviews / 40) * 5, 20);
    if (reviewBonus >= 10) {
      score += reviewBonus;
      reasons.push(`${tour.reviews}+ lượt đánh giá`);
      confidenceFactors += 1;
    } else if (reviewBonus > 0) {
      score += reviewBonus;
    }

    // Giá hợp lý so với rating (+15 điểm) - tăng từ 10
    const valueScore = (tour.rating / (tour.price / 1000000)) * 10;
    if (valueScore > 1.2) {
      score += 15;
      reasons.push('Giá tốt so với chất lượng');
      confidenceFactors += 1;
    }

    // Match với search history
    if (preferences.searchHistory && preferences.searchHistory.length > 0) {
      const searchMatch = preferences.searchHistory.some(query => {
        const lowerQuery = query.toLowerCase();
        return (
          tour.name.vi.toLowerCase().includes(lowerQuery) ||
          tour.location.toLowerCase().includes(lowerQuery) ||
          tour.type.toLowerCase().includes(lowerQuery)
        );
      });
      if (searchMatch) {
        score += 20;
        reasons.push('Phù hợp với tìm kiếm trước đây');
        confidenceFactors += 2;
      }
    }

    // Tính confidence level
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (confidenceFactors >= 6) {
      confidence = 'high';
    } else if (confidenceFactors >= 3) {
      confidence = 'medium';
    }

    return { score, reasons, confidence };
  }

  /**
   * Gợi ý tours cho người dùng (cải tiến)
   */
  static getRecommendations(
    allTours: Tour[],
    userBookings: Booking[],
    limit: number = 6,
    userId?: string
  ): RecommendationResult[] {
    const preferences = this.analyzeUserPreferences(userBookings, allTours, userId);

    // Chỉ lấy tours đã approved và available
    const availableTours = allTours.filter(t => t.status === 'approved' && t.availability);

    // Tính điểm cho từng tour
    const scoredTours = availableTours.map(tour => {
      const { score, reasons, confidence } = this.calculateTourScore(tour, preferences, userBookings);
      return {
        tour,
        score,
        reasons,
        confidence
      };
    });

    // Sắp xếp theo điểm (ưu tiên high confidence) và lấy top
    return scoredTours
      .filter(t => t.score > 0)
      .sort((a, b) => {
        // Ưu tiên confidence cao hơn
        if (a.confidence === 'high' && b.confidence !== 'high') return -1;
        if (b.confidence === 'high' && a.confidence !== 'high') return 1;

        // Sau đó mới so sánh điểm
        return b.score - a.score;
      })
      .slice(0, limit);
  }

  /**
   * Gợi ý thông minh kết hợp nhiều nguồn
   */
  static getSmartRecommendations(
    allTours: Tour[],
    userBookings: Booking[],
    userId: string,
    limit: number = 10
  ): {
    personalized: RecommendationResult[];
    trending: Tour[];
    similar: Tour[];
  } {
    // 1. Personalized recommendations
    const personalized = this.getRecommendations(allTours, userBookings, Math.ceil(limit * 0.6), userId);

    // 2. Trending tours
    const trending = this.getTrendingTours(allTours, Math.ceil(limit * 0.3))
      .filter(t => !personalized.find(p => p.tour.id === t.id)); // Loại trùng

    // 3. Similar to last booked
    let similar: Tour[] = [];
    if (userBookings.length > 0) {
      const lastBooked = userBookings[userBookings.length - 1];
      const lastTour = allTours.find(t => t.id === lastBooked.tourId);
      if (lastTour) {
        similar = this.getSimilarTours(lastTour, allTours, Math.ceil(limit * 0.2))
          .filter(t =>
            !personalized.find(p => p.tour.id === t.id) &&
            !trending.find(tr => tr.id === t.id)
          );
      }
    }

    return {
      personalized,
      trending,
      similar
    };
  }

  /**
   * Tìm tours tương tự
   */
  static getSimilarTours(
    currentTour: Tour,
    allTours: Tour[],
    limit: number = 4
  ): Tour[] {
    return allTours
      .filter(t =>
        t.id !== currentTour.id &&
        t.status === 'approved' &&
        t.availability &&
        (t.type === currentTour.type ||
          t.location === currentTour.location ||
          Math.abs(t.price - currentTour.price) < 1000000)
      )
      .sort((a, b) => {
        // Ưu tiên: cùng type > cùng location > giá gần
        let scoreA = 0;
        let scoreB = 0;

        if (a.type === currentTour.type) scoreA += 3;
        if (b.type === currentTour.type) scoreB += 3;

        if (a.location === currentTour.location) scoreA += 2;
        if (b.location === currentTour.location) scoreB += 2;

        scoreA += (5 - Math.abs(a.price - currentTour.price) / 1000000);
        scoreB += (5 - Math.abs(b.price - currentTour.price) / 1000000);

        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Smart search với AI scoring (cải tiến)
   */
  static smartSearch(
    query: string,
    allTours: Tour[],
    userBookings: Booking[] = [],
    userId?: string
  ): Tour[] {
    const lowerQuery = normalizeText(query);

    if (!lowerQuery) return [];

    const preferences = this.analyzeUserPreferences(userBookings, allTours, userId);

    // Tìm tours match query với scoring theo độ chính xác
    const matchedTours = allTours
      .filter(t => t.status === 'approved' && t.availability)
      .map(tour => {
        let matchScore = 0;
        const nameVi = tour.name.vi.toLowerCase();
        const nameEn = tour.name.en.toLowerCase();
        const descVi = tour.description.vi.toLowerCase();
        const descEn = tour.description.en.toLowerCase();
        const location = tour.location.toLowerCase();
        const type = tour.type.toLowerCase();
        const typeLabel = normalizeText(getTourTypeLabel(tour.type));

        // Exact match trong tên → điểm cao nhất
        if (nameVi === lowerQuery || nameEn === lowerQuery) matchScore += 100;
        else if (nameVi.includes(lowerQuery) || nameEn.includes(lowerQuery)) matchScore += 50;

        // Location match
        if (location === lowerQuery) matchScore += 80;
        else if (location.includes(lowerQuery)) matchScore += 40;

        // Type match
        if (type === lowerQuery || typeLabel === lowerQuery) matchScore += 60;
        else if (type.includes(lowerQuery) || typeLabel.includes(lowerQuery)) matchScore += 30;

        // Description match
        if (descVi.includes(lowerQuery) || descEn.includes(lowerQuery)) matchScore += 20;

        return { tour, matchScore };
      })
      .filter(item => item.matchScore > 0);

    // Kết hợp match score với user preference score
    const scoredResults = matchedTours.map(item => {
      const { score: prefScore } = this.calculateTourScore(item.tour, preferences, userBookings);
      // Match score quan trọng hơn (70%), preference score 30%
      const finalScore = item.matchScore * 0.7 + prefScore * 0.3;
      return { tour: item.tour, finalScore };
    });

    return scoredResults
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(item => item.tour);
  }

  /**
   * Gợi ý tìm kiếm real-time (khi người dùng đang gõ)
   */
  static getSearchSuggestions(
    query: string,
    allTours: Tour[],
    limit: number = 5
  ): string[] {
    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery.length < 2) return [];

    const suggestions = new Set<string>();

    // Lấy từ search history
    const history = this.getSearchHistory();
    history.forEach(h => {
      if (normalizeText(h).includes(lowerQuery)) {
        suggestions.add(h);
      }
    });

    // Lấy từ tour names
    DESTINATION_CATALOG.forEach(destination => {
      const searchable = [
        destination.name,
        destination.location,
        ...destination.aliases,
      ].map(normalizeText);

      if (searchable.some(value => value.includes(lowerQuery))) {
        suggestions.add(destination.name);
      }
    });

    allTours
      .filter(t => t.status === 'approved')
      .forEach(tour => {
        if (normalizeText(tour.name.vi).includes(lowerQuery)) {
          suggestions.add(tour.name.vi);
        }
        if (normalizeText(tour.location).includes(lowerQuery)) {
          suggestions.add(tour.location);
        }
      });

    return Array.from(suggestions).slice(0, limit);
  }



  /**
   * Chatbot: Trả lời câu hỏi và gợi ý tours
   */
  static async chatbotResponse(
    message: string,
    allTours: Tour[],
    userBookings: Booking[],
    language: 'vi' | 'en' = 'vi'
  ): Promise<{ text: string; tours?: Tour[] }> {
    const lowerMsg = message.toLowerCase().trim();

    // Intent detection
    const intents = {
      greeting: /^(xin chào|chào|hello|hi|hey)/i,
      tourSearch: /(tìm|gợi ý|giới thiệu|recommend|tour|du lịch)/i,
      price: /(giá|bao nhiêu|price|cost|chi phí)/i,
      duration: /(bao lâu|mấy ngày|duration|how long)/i,
      booking: /(đặt|book|booking|reserve)/i,
      help: /(giúp|help|hỗ trợ|support)/i,
      location: /(hà nội|sapa|hạ long|hội an|đà nẵng|nha trang|đà lạt|phú quốc|sài gòn|hanoi|danang|hoian)/i,
    };

    // Greeting
    if (intents.greeting.test(lowerMsg)) {
      return {
        text: language === 'vi'
          ? 'Xin chào! 👋 Tôi là trợ lý AI của ThichDulich. Tôi có thể giúp bạn tìm tour phù hợp. Bạn muốn đi đâu?'
          : 'Hello! 👋 I\'m ThichDulich AI assistant. I can help you find the perfect tour. Where would you like to go?'
      };
    }

    // Help
    if (intents.help.test(lowerMsg)) {
      return {
        text: language === 'vi'
          ? 'Tôi có thể giúp bạn:\n🔍 Tìm tour phù hợp\n💰 Tư vấn giá & thời gian\n📍 Gợi ý điểm đến\n📅 Hỗ trợ đặt tour\n\nHãy cho tôi biết bạn muốn đi đâu nhé!'
          : 'I can help you:\n🔍 Find suitable tours\n💰 Price & duration advice\n📍 Destination suggestions\n📅 Booking support\n\nLet me know where you want to go!'
      };
    }

    // Location-based search
    if (intents.location.test(lowerMsg)) {
      const locationMatch = lowerMsg.match(intents.location);
      if (locationMatch) {
        const searchResults = this.smartSearch(locationMatch[0], allTours, userBookings);
        return {
          text: language === 'vi'
            ? `Tôi tìm được ${searchResults.length} tour tại ${locationMatch[0]}. Dưới đây là những gợi ý tốt nhất:`
            : `I found ${searchResults.length} tours in ${locationMatch[0]}. Here are the best suggestions:`,
          tours: searchResults.slice(0, 4)
        };
      }
    }

    // General tour search
    if (intents.tourSearch.test(lowerMsg)) {
      const recommendations = this.getRecommendations(allTours, userBookings, 4);
      if (recommendations.length > 0) {
        return {
          text: language === 'vi'
            ? `Dựa trên sở thích của bạn, tôi gợi ý ${recommendations.length} tour này:\n${recommendations.map((r, i) => `${i + 1}. ${r.tour.name.vi} - ${r.reasons[0]}`).join('\n')}`
            : `Based on your preferences, I recommend these ${recommendations.length} tours:\n${recommendations.map((r, i) => `${i + 1}. ${r.tour.name.en} - ${r.reasons[0]}`).join('\n')}`,
          tours: recommendations.map(r => r.tour)
        };
      }
    }

    // Default: Smart search
    const searchResults = this.smartSearch(lowerMsg, allTours, userBookings);
    if (searchResults.length > 0) {
      return {
        text: language === 'vi'
          ? `Tôi tìm thấy ${searchResults.length} tour phù hợp với "${message}". Dưới đây là gợi ý tốt nhất:`
          : `I found ${searchResults.length} tours matching "${message}". Here are the best suggestions:`,
        tours: searchResults.slice(0, 4)
      };
    }

    // No results
    return {
      text: language === 'vi'
        ? 'Xin lỗi, tôi không tìm thấy tour phù hợp. Bạn có thể thử:\n- Đổi từ khóa tìm kiếm\n- Hỏi "gợi ý tour cho tôi"\n- Hoặc nói "giúp tôi" để xem tất cả chức năng'
        : 'Sorry, I couldn\'t find matching tours. You can try:\n- Change search keywords\n- Ask "recommend tours for me"\n- Or say "help" to see all features'
    };
  }
}
