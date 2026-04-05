import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
  Path,
} from '@react-pdf/renderer'
import type { CertificateData } from '@/lib/services/certificate.service'

const colors = {
  primary: '#2B4C7E',
  primaryLight: '#7EADD4',
  primaryDark: '#1E3A5F',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  green: '#10B981',
  greenLight: '#D1FAE5',
  text: '#1F2937',
  textLight: '#6B7280',
  bg: '#FFFFFF',
  bgSoft: '#F8FAFC',
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.bg,
    fontFamily: 'Helvetica',
    position: 'relative',
    overflow: 'hidden',
  },
  // Top colored banner
  banner: {
    backgroundColor: colors.primary,
    height: 100,
    width: '100%',
    position: 'relative',
  },
  bannerWave: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    width: '100%',
  },
  // Content area
  content: {
    flex: 1,
    paddingHorizontal: 60,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Logo on banner
  logoArea: {
    position: 'absolute',
    top: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.bg,
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: 9,
    color: '#7EADD4',
    letterSpacing: 3,
    marginTop: 3,
  },
  // Trophy icon area
  trophyArea: {
    alignItems: 'center',
    marginBottom: 15,
  },
  trophyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -35,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  // Main title
  titleLabel: {
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 4,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Recipient
  awardedTo: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 6,
  },
  recipientName: {
    fontSize: 30,
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Parcours
  parcoursLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 6,
  },
  parcoursTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 25,
    justifyContent: 'center',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.bgSoft,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 8,
    color: colors.textLight,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Date
  dateText: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 15,
  },
  // Decorative confetti dots
  confettiDot: {
    position: 'absolute',
    borderRadius: 50,
  },
  // Footer
  footer: {
    paddingHorizontal: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerLine: {
    width: 200,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})

// Confetti decoration
function ConfettiDots() {
  const dots = [
    { top: 110, left: 45, size: 8, color: colors.accent },
    { top: 130, left: 80, size: 5, color: colors.primaryLight },
    { top: 115, right: 50, size: 7, color: colors.greenLight },
    { top: 140, right: 90, size: 4, color: colors.accentLight },
    { top: 105, left: 150, size: 6, color: colors.greenLight },
    { top: 125, right: 160, size: 5, color: colors.accent },
  ]

  return (
    <>
      {dots.map((dot, i) => (
        <View
          key={i}
          style={[
            styles.confettiDot,
            {
              top: dot.top,
              ...(dot.left !== undefined ? { left: dot.left } : {}),
              ...(dot.right !== undefined ? { right: dot.right } : {}),
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
            },
          ]}
        />
      ))}
    </>
  )
}

interface CertificateTemplateProps {
  data: CertificateData
}

export function CertificateTemplate({ data }: CertificateTemplateProps) {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(data.completedAt)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Top banner */}
        <View style={styles.banner}>
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>FormaCPV</Text>
            <Text style={styles.logoSub}>PLATEFORME DE FORMATION</Text>
          </View>
          {/* Wave separator */}
          <Svg viewBox="0 0 842 40" style={styles.bannerWave}>
            <Path
              d="M0,20 C200,45 400,0 842,25 L842,40 L0,40 Z"
              fill={colors.bg}
            />
          </Svg>
        </View>

        {/* Confetti dots */}
        <ConfettiDots />

        {/* Main content */}
        <View style={styles.content}>
          {/* Trophy */}
          <View style={styles.trophyArea}>
            <View style={styles.trophyCircle}>
              <Svg viewBox="0 0 24 24" width={32} height={32}>
                <Path
                  d="M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
                  fill={colors.accent}
                />
                <Path
                  d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"
                  fill={colors.accent}
                  stroke={colors.bg}
                  strokeWidth={0.5}
                />
                <Circle cx={12} cy={8} r={3} fill={colors.bg} />
                <Path
                  d="M11.2 7.2L12 5.5l.8 1.7 1.7.3-1.2 1.2.3 1.8L12 9.8l-1.6.7.3-1.8-1.2-1.2z"
                  fill={colors.accent}
                />
              </Svg>
            </View>
          </View>

          <Text style={styles.titleLabel}>BRAVO !</Text>
          <Text style={styles.title}>Parcours terminé avec succès</Text>

          <Text style={styles.awardedTo}>Décerné à</Text>
          <Text style={styles.recipientName}>{data.userName}</Text>

          <Text style={styles.parcoursLabel}>pour avoir complété le parcours</Text>
          <Text style={styles.parcoursTitle}>{data.parcoursTitle}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.modulesCompleted}</Text>
              <Text style={styles.statLabel}>Modules</Text>
            </View>
            {data.avgQuizScore !== null && (
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{data.avgQuizScore}%</Text>
                <Text style={styles.statLabel}>Score quiz</Text>
              </View>
            )}
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {data.totalDurationDays === 1 ? '1' : data.totalDurationDays}
              </Text>
              <Text style={styles.statLabel}>
                {data.totalDurationDays === 1 ? 'Jour' : 'Jours'}
              </Text>
            </View>
          </View>

          <Text style={styles.dateText}>
            Délivré le {formattedDate}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            FormaCPV — Plateforme de formation interne
          </Text>
        </View>
      </Page>
    </Document>
  )
}
