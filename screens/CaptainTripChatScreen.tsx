import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_ENDPOINTS } from '../services/api';

type ChatMessage = {
  message_id: number;
  booking_id: number;
  sender_type: 'user' | 'captain';
  sender_id: number;
  sender_name?: string;
  message: string;
  created_at?: string;
};

const CaptainTripChatScreen: React.FC<any> = ({ route, navigation }) => {
  const { bookingId, selectedLanguage = 'English', token, passengerName } = route.params || {};
  const isArabic = selectedLanguage === 'Arabic';
  const getText = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const endpoint = API_ENDPOINTS.CAPTAIN_TRIP_MESSAGES(Number(bookingId));

  const loadMessages = useCallback(async () => {
    if (!bookingId || !token) { setError(getText('Chat details are unavailable.', 'تفاصيل المحادثة غير متاحة.')); setLoading(false); return; }
    try {
      const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || `HTTP ${response.status}`);
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
      setError('');
    } catch (requestError: any) {
      setError(requestError?.message || getText('Unable to refresh messages.', 'تعذر تحديث الرسائل.'));
    } finally { setLoading(false); }
  }, [endpoint, getText, bookingId, token]);

  useEffect(() => {
    loadMessages();
    const poll = setInterval(loadMessages, 3000);
    return () => clearInterval(poll);
  }, [loadMessages]);

  const sendMessage = async (preset?: string) => {
    const text = String(preset ?? draft).trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: text }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || getText('Message could not be sent.', 'تعذر إرسال الرسالة.'));
      setDraft('');
      await loadMessages();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (sendError: any) {
      setError(sendError?.message || getText('Message could not be sent.', 'تعذر إرسال الرسالة.'));
    } finally { setSending(false); }
  };

  const presets = isArabic ? ['أنا في طريقي', 'لقد وصلت إلى موقع الاستلام', 'من فضلك كن مستعداً'] : ['I am on my way', 'I have arrived', 'Please be ready'];
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = item.sender_type === 'captain';
    return <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}><View style={[styles.bubble, mine ? styles.myBubble : styles.otherBubble]}>{!mine && <Text style={styles.senderName}>{item.sender_name || passengerName || getText('Passenger', 'الراكب')}</Text>}<Text style={[styles.messageText, mine && styles.myMessageText]}>{item.message}</Text><Text style={[styles.messageTime, mine && styles.myMessageTime]}>{item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text></View></View>;
  };

  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backText}>{isArabic ? 'رجوع' : 'Back'}</Text></TouchableOpacity><View style={styles.headerText}><Text style={styles.title}>{getText('Trip Chat', 'محادثة الرحلة')}</Text><Text style={styles.subtitle}>{passengerName || getText('Passenger', 'الراكب')}</Text></View></View>
    {loading ? <View style={styles.loading}><ActivityIndicator color="#D4AF37" size="large" /></View> : <FlatList ref={listRef} data={messages} keyExtractor={(item) => String(item.message_id)} renderItem={renderMessage} contentContainerStyle={styles.messageList} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })} ListEmptyComponent={<Text style={styles.emptyText}>{getText('Start the conversation with the passenger.', 'ابدأ المحادثة مع الراكب.')}</Text>} />}
    {!!error && <Text style={styles.errorText}>{error}</Text>}
    <View style={styles.presetRow}>{presets.map((preset) => <TouchableOpacity key={preset} style={styles.presetButton} onPress={() => sendMessage(preset)} disabled={sending}><Text style={styles.presetText}>{preset}</Text></TouchableOpacity>)}</View>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}><View style={styles.composer}><TextInput style={[styles.input, isArabic && styles.rtl]} value={draft} onChangeText={setDraft} placeholder={getText('Write a message…', 'اكتب رسالة…')} placeholderTextColor="#8E8E93" multiline maxLength={1000} /><TouchableOpacity style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]} onPress={() => sendMessage()} disabled={!draft.trim() || sending}>{sending ? <ActivityIndicator color="#111827" /> : <Text style={styles.sendText}>{getText('Send', 'إرسال')}</Text>}</TouchableOpacity></View></KeyboardAvoidingView>
  </SafeAreaView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8' }, header: { backgroundColor: '#101827', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }, backButton: { paddingVertical: 8, paddingRight: 14 }, backText: { color: '#D4AF37', fontSize: 15, fontWeight: '700' }, headerText: { flex: 1 }, title: { color: '#fff', fontSize: 19, fontWeight: '800' }, subtitle: { color: '#C7CDD7', fontSize: 12, marginTop: 2 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }, messageList: { paddingHorizontal: 14, paddingVertical: 16, flexGrow: 1 }, emptyText: { textAlign: 'center', color: '#7A7F87', marginTop: 32, fontSize: 14 },
  messageRow: { flexDirection: 'row', marginBottom: 10 }, messageRowMine: { justifyContent: 'flex-end' }, messageRowOther: { justifyContent: 'flex-start' }, bubble: { maxWidth: '82%', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16 }, myBubble: { backgroundColor: '#D4AF37', borderBottomRightRadius: 3 }, otherBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 3, elevation: 1 }, senderName: { color: '#A57900', fontSize: 11, fontWeight: '800', marginBottom: 3 }, messageText: { color: '#172033', fontSize: 15, lineHeight: 20 }, myMessageText: { color: '#101827' }, messageTime: { color: '#8A8F98', alignSelf: 'flex-end', fontSize: 10, marginTop: 4 }, myMessageTime: { color: '#5A4800' },
  errorText: { color: '#B42318', textAlign: 'center', paddingHorizontal: 16, paddingBottom: 5, fontSize: 12 }, presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingTop: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E6E8EB' }, presetButton: { borderColor: '#D4AF37', borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }, presetText: { color: '#846500', fontSize: 11, fontWeight: '600' }, composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' }, input: { flex: 1, backgroundColor: '#F2F3F5', borderRadius: 18, minHeight: 42, maxHeight: 100, paddingHorizontal: 14, paddingTop: 11, color: '#172033', fontSize: 15 }, rtl: { textAlign: 'right' }, sendButton: { backgroundColor: '#D4AF37', minHeight: 42, minWidth: 64, justifyContent: 'center', alignItems: 'center', borderRadius: 18, marginLeft: 8, paddingHorizontal: 10 }, sendButtonDisabled: { opacity: 0.45 }, sendText: { color: '#111827', fontWeight: '800', fontSize: 14 },
});

export default CaptainTripChatScreen;
