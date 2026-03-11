import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { CertificateData } from '@/lib/services/certificate.service'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  border: {
    border: '3pt solid #2563EB',
    padding: 30,
    height: '100%',
    position: 'relative',
  },
  innerBorder: {
    border: '1pt solid #93C5FD',
    padding: 25,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
  },
  certificateOf: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  recipient: {
    fontSize: 28,
    color: '#2563EB',
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  parcoursTitle: {
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  details: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 20,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 30,
    borderTop: '1pt solid #E5E7EB',
    width: '100%',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signature: {
    alignItems: 'center',
    width: '40%',
  },
  signatureLine: {
    borderTop: '1pt solid #1F2937',
    width: 150,
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    color: '#6B7280',
  },
  decorativeElement: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
  },
  topLeft: {
    top: -5,
    left: -5,
  },
  topRight: {
    top: -5,
    right: -5,
  },
  bottomLeft: {
    bottom: -5,
    left: -5,
  },
  bottomRight: {
    bottom: -5,
    right: -5,
  },
})

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
        <View style={styles.border}>
          {/* Decorative corners */}
          <View style={[styles.decorativeElement, styles.topLeft]} />
          <View style={[styles.decorativeElement, styles.topRight]} />
          <View style={[styles.decorativeElement, styles.bottomLeft]} />
          <View style={[styles.decorativeElement, styles.bottomRight]} />

          <View style={styles.innerBorder}>
            {/* Header with logo */}
            <View style={styles.header}>
              <Text style={styles.logo}>FormaCPV</Text>
              <Text style={styles.subtitle}>FORMATION PROFESSIONNELLE</Text>
            </View>

            {/* Certificate title */}
            <Text style={styles.certificateOf}>CERTIFICAT DE RÉUSSITE</Text>
            <Text style={styles.title}>Certificat de Formation</Text>

            {/* Recipient */}
            <Text style={styles.description}>
              Ce certificat est décerné à
            </Text>
            <Text style={styles.recipient}>{data.userName}</Text>

            {/* Course details */}
            <Text style={styles.description}>
              pour avoir complété avec succès le parcours de formation
            </Text>
            <Text style={styles.parcoursTitle}>{data.parcoursTitle}</Text>

            {/* Stats */}
            <Text style={styles.details}>
              {data.modulesCompleted} modules complétés
            </Text>

            {/* Date */}
            <Text style={styles.date}>
              Délivré le {formattedDate}
            </Text>

            {/* Footer with signatures */}
            <View style={styles.footer}>
              <View style={styles.footerContent}>
                <View style={styles.signature}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>Le Responsable Formation</Text>
                </View>
                <View style={styles.signature}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>Le Directeur</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
