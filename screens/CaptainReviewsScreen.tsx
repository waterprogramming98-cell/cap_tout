// screens/CaptainReviewsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// ✅ Import your navigation types
import { RootStackParamList } from '../types/navigation';
import { getCaptainReviews } from '../services/api';
import { CaptainReviewsScreenStyles as styles } from '../styles/CaptainReviewsScreen.styles';

// ✅ Type your props using navigation stack
type Props = NativeStackScreenProps<RootStackParamList, 'CaptainReviews'>;

// ✅ Define Review item type
interface CaptainReview {
  review_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// ✅ Type API response
interface ReviewsResponse {
  success: boolean;
  reviews?: CaptainReview[];
  data?: { reviews?: CaptainReview[] };
}

const CaptainReviewsScreen: React.FC<Props> = ({ route }) => {
  const { captainId, captainName } = route.params;
  const [reviews, setReviews] = useState<CaptainReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response: ReviewsResponse = await getCaptainReviews(captainId);
        const reviewList = response.data?.reviews || response.reviews || [];
        setReviews(response.success ? reviewList : []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [captainId]);

  const renderStar = (rating: number) => '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);

  const renderItem = ({ item }: { item: CaptainReview }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.author_name}</Text>
        <Text style={styles.starIcon}>{renderStar(item.rating)}</Text>
      </View>
      <Text style={styles.reviewText}>{item.comment}</Text>
      <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reviews for {captainName}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B4513" />
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderItem}
          keyExtractor={(item) => item.review_id.toString()}
          ListEmptyComponent={<Text style={styles.reviewText}>No reviews yet.</Text>}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}
    </View>
  );
};

export default CaptainReviewsScreen;
