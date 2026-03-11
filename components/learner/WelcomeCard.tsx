import { GraduationCap, Sparkles } from 'lucide-react'

interface WelcomeCardProps {
  userName: string
  parcoursTitle: string
}

export function WelcomeCard({ userName, parcoursTitle }: WelcomeCardProps) {
  const firstName = userName.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{greeting}</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              {firstName} !
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              Continuez votre apprentissage
            </p>
          </div>
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
          <p className="text-xs text-primary-foreground/70 uppercase tracking-wide mb-1">
            Parcours actuel
          </p>
          <p className="font-semibold text-lg">
            {parcoursTitle}
          </p>
        </div>
      </div>
    </div>
  )
}
