/*
 * CHECKOUT STATUS STORYBOARD
 * Checkout controls remain visible and actionable without an entrance delay.
 * Server PAID confirmation  check seal plays once; no success animation runs for a client callback alone.
 * Reduced-motion setting  the check seal is shown on its final frame.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import { Button } from '../../components/Button';
import { LottieIllustration } from '../../components/LottieIllustration';
import { useCart } from '../../hooks/useCart';
import { useProfile } from '../../hooks/useProfile';
import { useAuthToken } from '../../hooks/useAuthToken';
import { apiClient, ApiClientError } from '../../services/apiClient';
import type { DeliveryDetailsDTO } from '../../sharedTypes';

type Fulfillment = 'PICKUP' | 'DELIVERY';
interface CheckoutPayment {
  id: string;
  status: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  fulfillmentMethod: Fulfillment;
  transactionRef: string;
  amountKobo: number;
  publicKey: string;
  email: string;
  customerName: string;
  deliveryAddress: string;
  deliveryPhone: string;
  itemBookIds: string[];
  paymentAllowed: boolean;
  refundReference?: string | null;
}

interface CheckoutScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string) => void };
}

const emptyDetails: DeliveryDetailsDTO = {
  fullName: '', phoneNumber: '', hostelOrAddress: '', campusArea: '', alternatePhoneNumber: '',
};

export function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const { colors } = useTheme();
  const { items, removeMany } = useCart();
  const { profile, getDeliveryDetails } = useProfile();
  const { getToken } = useAuthToken();
  const [fulfillment, setFulfillment] = useState<Fulfillment>('PICKUP');
  const [details, setDetails] = useState<DeliveryDetailsDTO>(emptyDetails);
  const [payment, setPayment] = useState<CheckoutPayment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const idempotencyKey = useRef(Crypto.randomUUID());
  const finished = useRef(false);
  const subtotal = useMemo(() => items.reduce((sum, book) => sum + Number(book.price), 0), [items]);
  const fee = fulfillment === 'DELIVERY' ? 500 : 0;

  useEffect(() => {
    getDeliveryDetails().then((saved) => {
      if (saved) setDetails((current) => ({ ...current, ...saved }));
    }).catch(() => {});
  }, [getDeliveryDetails]);

  useEffect(() => {
    let active = true;
    apiClient.get<{ checkout: CheckoutPayment | null }>('/api/v1/checkout/pending', getToken)
      .then(({ checkout }) => {
        if (active && checkout) {
          setPayment(checkout);
          setFulfillment(checkout.fulfillmentMethod);
          setChecking(checkout.paymentAllowed);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [getToken]);

  const refreshPaymentStatus = useCallback(async (): Promise<'pending' | 'network_error' | 'finished'> => {
    if (!payment || finished.current) return 'finished';
    try {
      const status = await apiClient.get<{ status: string; refundReference?: string | null }>(`/api/v1/checkout/${payment.id}`, getToken);
      if (status.status === 'PAID') {
        finished.current = true;
        removeMany(payment.itemBookIds);
        setPayment({ ...payment, status: 'PAID' });
        setChecking(false);
        setStatusNote(null);
        Alert.alert('Payment confirmed', 'Your order is confirmed. You can track pickup or delivery from your orders.', [
          { text: 'View library', onPress: () => navigation.navigate('LibraryTab') },
        ]);
        return 'finished';
      } else if (status.status === 'FAILED') {
        finished.current = true;
        setPayment(null);
        setError('Squad could not confirm this payment. You can start a new payment attempt.');
        idempotencyKey.current = Crypto.randomUUID();
        setChecking(false);
        setStatusNote(null);
        return 'finished';
      } else if (status.status === 'REFUND_PENDING' || status.status === 'REFUND_PROCESSING' || status.status === 'REFUND_REQUESTED' || status.status === 'REFUNDED') {
        finished.current = true;
        setPayment({ ...payment, status: status.status, refundReference: status.refundReference });
        setChecking(false);
        setStatusNote(null);
        return 'finished';
      }
      setStatusNote('Payment is waiting for Squad confirmation. Keep this screen open, or return to checkout later.');
      return 'pending';
    } catch {
      // A slow or interrupted status request does not mean the payment failed.
      setStatusNote('Network is slow. Your payment is not marked failed; we’ll keep checking when the connection recovers.');
      return 'network_error';
    }
  }, [payment, getToken, removeMany, navigation]);

  useEffect(() => {
    if (!checking || !payment) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let networkFailures = 0;

    const poll = async () => {
      const result = await refreshPaymentStatus();
      if (cancelled || result === 'finished' || finished.current) return;

      // Do not overlap requests: API calls time out after 15 seconds, so a fixed
      // 2.5-second interval could queue several checks during a slow connection.
      const delay = result === 'network_error'
        ? Math.min(2_500 * (2 ** networkFailures++), 15_000)
        : (networkFailures = 0, 3_000);
      timer = setTimeout(poll, delay);
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [checking, payment?.id, refreshPaymentStatus]);

  const startPayment = async () => {
    setError(null);
    setStatusNote(null);
    finished.current = false;
    if (!items.length) {
      setError('Your cart is empty. Add a book before checkout.');
      return;
    }
    if (details.fullName.trim().length < 2) {
      setError('Enter the name to use for your order.');
      return;
    }
    if (!/^(\+?234|0)[789][01]\d{8}$/.test(details.phoneNumber)) {
      setError('Enter a valid Nigerian phone number.');
      return;
    }
    if (fulfillment === 'DELIVERY' && details.hostelOrAddress.trim().length < 5) {
      setError('Enter a hostel or delivery address of at least 5 characters.');
      return;
    }
    if (!profile?.email) {
      setError('Add an email address to your profile so Squad can send your payment receipt.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiClient.post<CheckoutPayment>('/api/v1/checkout', {
        items: items.map((book) => ({ bookId: book.id })),
        fulfillmentMethod: fulfillment,
        deliveryDetails: {
          fullName: details.fullName.trim(),
          phoneNumber: details.phoneNumber.trim(),
          ...(fulfillment === 'DELIVERY' ? {
            hostelOrAddress: details.hostelOrAddress.trim(),
            campusArea: details.campusArea?.trim() ?? '',
          } : {}),
        },
      }, getToken, { 'Idempotency-Key': idempotencyKey.current });
      if (result.status === 'FAILED') {
        setError('This payment attempt failed. Start checkout again to try a new payment.');
        idempotencyKey.current = Crypto.randomUUID();
        setPayment(null);
      } else if (result.paymentAllowed) {
        setPayment(result);
        setChecking(true);
      } else {
        setPayment(result);
        setError(`This checkout is ${result.status.toLowerCase().replaceAll('_', ' ')}.`);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not start checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (message.type === 'success' || message.type === 'closed') setChecking(true);
    } catch {
      setChecking(true);
    }
  };

  if (payment?.status === 'PAID') {
    return <StatusScreen title="Payment confirmed" body="Your books are in your orders." colors={colors} onDone={() => navigation.navigate('LibraryTab')} animation={require('../../../assets/animations/order-success.json')} />;
  }
  if (payment && (payment.status === 'REFUND_PENDING' || payment.status === 'REFUND_PROCESSING' || payment.status === 'REFUND_REQUESTED' || payment.status === 'REFUNDED')) {
    const refunded = payment.status === 'REFUNDED';
    const pendingReview = payment.status === 'REFUND_PENDING';
    return <StatusScreen
      title={refunded ? 'Refund completed' : 'Refund in progress'}
      body={refunded ? 'Squad confirmed the refund. The books have been removed from your library.' : pendingReview ? 'We could not fulfill this order. Your refund is awaiting review; contact FUBOOKS support if you need an update.' : 'We could not fulfill this order. A refund request is being processed by Squad.'}
      colors={colors}
      onDone={() => navigation.goBack()}
    />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>← Back to cart</Text>
        </Pressable>
        <Text style={[typography.h1, { color: colors.textPrimary, marginTop: spacing.md }]}>Checkout</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>{payment?.itemBookIds.length ?? items.length} {(payment?.itemBookIds.length ?? items.length) === 1 ? 'book' : 'books'} · payment secured by Squad</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>{profile?.email ? `Receipt email: ${profile.email}` : 'Add an email to your profile to continue to payment.'}</Text>
        {!profile?.email ? <Pressable onPress={() => navigation.navigate('ProfileTab')} hitSlop={10} style={styles.back}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>Open profile to add email</Text>
        </Pressable> : null}

        {!payment ? <>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>How would you like to receive your books?</Text>
          <MethodOption selected={fulfillment === 'PICKUP'} label="Pick up" detail="Old Sug Resource Center · Free" onPress={() => setFulfillment('PICKUP')} colors={colors} />
          <MethodOption selected={fulfillment === 'DELIVERY'} label="Deliver to me" detail="₦500 delivery fee" onPress={() => setFulfillment('DELIVERY')} colors={colors} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Order contact</Text>
          <Field label="Full name" value={details.fullName} onChangeText={(v) => setDetails((d) => ({ ...d, fullName: v }))} colors={colors} />
          <Field label="Phone number" value={details.phoneNumber} onChangeText={(v) => setDetails((d) => ({ ...d, phoneNumber: v }))} keyboardType="phone-pad" colors={colors} />
          {fulfillment === 'DELIVERY' ? <>
            <Field label="Hostel / delivery address" value={details.hostelOrAddress} onChangeText={(v) => setDetails((d) => ({ ...d, hostelOrAddress: v }))} colors={colors} />
            <Field label="Campus area (optional)" value={details.campusArea ?? ''} onChangeText={(v) => setDetails((d) => ({ ...d, campusArea: v }))} colors={colors} />
          </> : <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>Pickup point: {PICKUP_STATION}</Text>}
        </View>
        </> : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{payment.fulfillmentMethod === 'PICKUP' ? 'Pickup' : 'Delivery'}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>{payment.deliveryAddress}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>{payment.deliveryPhone}</Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}>Payment summary</Text>
          <SummaryLine label="Books" amount={Number(payment?.subtotal ?? subtotal)} colors={colors} />
          <SummaryLine label={payment?.fulfillmentMethod === 'DELIVERY' || (!payment && fulfillment === 'DELIVERY') ? 'Delivery' : 'Pickup'} amount={Number(payment?.deliveryFee ?? fee)} colors={colors} />
          <View style={[styles.divider, { borderColor: colors.border }]} />
          <SummaryLine label="Total" amount={Number(payment?.total ?? (subtotal + fee))} bold colors={colors} />
        </View>

        {error ? <Text accessibilityRole="alert" style={[typography.body, { color: colors.error, marginBottom: spacing.md }]}>{error}</Text> : null}

        {payment?.paymentAllowed ? <>
          <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Complete payment in Squad checkout</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>You can pay by card, bank transfer, USSD, or bank. Your order is confirmed only after Squad verifies the payment.</Text>
          </View>
          <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.sm }]}>
            {statusNote ?? 'We’ll confirm the payment from Squad before completing your order.'}
          </Text>
          <View style={styles.webviewWrap}>
            <WebView
              originWhitelist={['*']}
              source={{ html: squadCheckoutHtml(payment) }}
              javaScriptEnabled
              domStorageEnabled
              onMessage={handlePaymentMessage}
              style={styles.webview}
              startInLoadingState
              renderLoading={() => <ActivityIndicator style={styles.webviewLoading} color={colors.primary} />}
            />
          </View>
          <Button label={checking ? 'Checking payment status…' : 'I have paid — check order'} onPress={() => { finished.current = false; setChecking(true); }} loading={checking} variant="outline" />
        </> : (
          <Button label={`Pay ₦${Number(payment?.total ?? (subtotal + fee)).toLocaleString('en-NG')}`} onPress={startPayment} loading={submitting} disabled={items.length === 0 || checking} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const PICKUP_STATION = 'Old Sug Resource Center';

function squadCheckoutHtml(payment: CheckoutPayment) {
  const config = JSON.stringify({
    key: payment.publicKey,
    email: payment.email,
    amount: payment.amountKobo,
    currency_code: 'NGN',
    transaction_ref: payment.transactionRef,
    customer_name: payment.customerName,
    payment_channels: ['card', 'bank', 'ussd', 'transfer'],
  }).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="font-family:system-ui;padding:12px"><button id="pay" style="width:100%;min-height:48px;border:0;border-radius:12px;background:#6C4CF1;color:white;font-size:16px;font-weight:700">Continue to Squad payment</button><p id="message" style="color:#6B7280;font-size:13px"></p><script src="https://checkout.squadco.com/widget/squad.min.js"></script><script>const config=${config};document.getElementById('pay').onclick=()=>{try{const checkout=new squad({...config,onLoad:()=>{document.getElementById('message').textContent='Squad checkout is ready.'},onClose:()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'closed'})),onSuccess:()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'success'}))});checkout.setup();checkout.open()}catch(e){document.getElementById('message').textContent='Could not open Squad checkout. Check your connection and try again.'}}</script></body></html>`;
}

function MethodOption({ selected, label, detail, onPress, colors }: { selected: boolean; label: string; detail: string; onPress: () => void; colors: { primary: string; border: string; surface: string; textPrimary: string; textSecondary: string } }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[styles.option, { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.surface }]}>
    <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>{selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
    <View style={{ flex: 1 }}><Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{label}</Text><Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{detail}</Text></View>
  </Pressable>;
}

function Field({ label, value, onChangeText, keyboardType, colors }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'phone-pad'; colors: { border: string; textPrimary: string; background: string; textSecondary: string } }) {
  return <View style={{ marginBottom: spacing.md }}>
    <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType ?? 'default'} placeholderTextColor={colors.textSecondary} style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]} />
  </View>;
}

function SummaryLine({ label, amount, bold, colors }: { label: string; amount: number; bold?: boolean; colors: { textPrimary: string; textSecondary: string; primary: string } }) {
  return <View style={styles.summaryLine}><Text style={[bold ? typography.bodyBold : typography.body, { color: bold ? colors.textPrimary : colors.textSecondary }]}>{label}</Text><Text style={[bold ? typography.bodyBold : typography.body, { color: bold ? colors.primary : colors.textPrimary }]}>₦{amount.toLocaleString('en-NG')}</Text></View>;
}

function StatusScreen({ title, body, colors, onDone, animation }: { title: string; body: string; colors: { background: string; textPrimary: string; textSecondary: string }; onDone: () => void; animation?: React.ComponentProps<typeof LottieIllustration>['source'] }) {
  return <SafeAreaView style={[styles.status, { backgroundColor: colors.background }]}>
    {animation ? <LottieIllustration source={animation} size={136} label="Order confirmed" /> : null}
    <Text style={[typography.h1, { color: colors.textPrimary, textAlign: 'center' }]}>{title}</Text>
    <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>{body}</Text>
    <Button label="Done" onPress={onDone} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: { minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: spacing.md },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, minHeight: 64 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 44 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  divider: { borderTopWidth: 1, marginVertical: spacing.md },
  notice: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  webviewWrap: { height: 520, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  webview: { flex: 1, backgroundColor: 'transparent' },
  webviewLoading: { flex: 1 },
  status: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
