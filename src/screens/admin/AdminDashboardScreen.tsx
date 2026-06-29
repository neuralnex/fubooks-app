import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/colors';
import { apiClient } from '../../services/apiClient';
import { useAdminGetToken } from '../../context/AdminAuthContext';
import type { LevelRevenuePoint, FacultyDistributionPoint } from '../../sharedTypes';

const FACULTY_COLORS = ['#6C4CF1', '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export function AdminDashboardScreen() {
  const { colors } = useTheme();
  const getToken = useAdminGetToken();
  const [revenuePoints, setRevenuePoints] = useState<LevelRevenuePoint[]>([]);
  const [facultyPoints, setFacultyPoints] = useState<FacultyDistributionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [revRes, facRes] = await Promise.all([
          apiClient.get<{ points: LevelRevenuePoint[] }>(
            '/api/v1/admin/analytics/revenue-by-level',
            getToken
          ),
          apiClient.get<{ points: FacultyDistributionPoint[]; totalOrders: number }>(
            '/api/v1/admin/analytics/distribution-by-faculty',
            getToken
          ),
        ]);
        setRevenuePoints(revRes.points);
        setFacultyPoints(facRes.points);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  const barData = revenuePoints.map((p) => ({
    value: p.totalOrders,
    label: p.level.replace('L', '') + 'L',
    frontColor: colors.primary,
    topLabelComponent: () => (
      <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{p.totalOrders}</Text>
    ),
  }));

  const totalFacultyOrders = facultyPoints.reduce((sum, p) => sum + p.totalOrders, 0);
  const pieData = facultyPoints
    .filter((p) => p.totalOrders > 0)
    .map((p, i) => ({
      value: p.totalOrders,
      color: FACULTY_COLORS[i % FACULTY_COLORS.length],
      text: `${p.percentage}%`,
      label: p.faculty,
    }));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Analytics</Text>

        {/* Bar Chart: orders/revenue per academic level */}
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}>
            Orders by Level
          </Text>
          {barData.length > 0 ? (
            <BarChart
              data={barData}
              barWidth={28}
              barBorderRadius={6}
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={0}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              isAnimated
            />
          ) : (
            <EmptyState colors={colors} />
          )}
          <View style={styles.totalRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Total Revenue:{' '}
            </Text>
            <Text style={[typography.bodyBold, { color: colors.success }]}>
              ₦
              {revenuePoints
                .reduce((sum, p) => sum + Number(p.totalRevenue), 0)
                .toLocaleString('en-NG')}
            </Text>
          </View>
        </View>

        {/* Donut Chart: purchase distribution by faculty */}
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}>
            Distribution by Faculty
          </Text>
          {pieData.length > 0 ? (
            <View style={styles.donutRow}>
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={50}
                innerCircleColor={colors.surface}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[typography.h2, { color: colors.textPrimary }]}>
                      {totalFacultyOrders}
                    </Text>
                    <Text style={[typography.small, { color: colors.textSecondary }]}>orders</Text>
                  </View>
                )}
              />
              <View style={styles.legend}>
                {pieData.map((slice) => (
                  <View key={slice.label} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                    <Text style={[typography.caption, { color: colors.textPrimary, flex: 1 }]}>
                      {slice.label}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {slice.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <EmptyState colors={colors} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({ colors }: { colors: { textSecondary: string } }) {
  return (
    <Text
      style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl }}
    >
      No completed orders yet.
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  totalRow: { flexDirection: 'row', marginTop: spacing.md },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  legend: { flex: 1, gap: spacing.xs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: radius.full },
});
