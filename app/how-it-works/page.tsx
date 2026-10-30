import { HowItWorksJourney } from '@/components/how-it-works-journey'
import { SiteShell } from '@/components/site-shell'
import { createSeoMetadata } from '@/lib/seo'

export const metadata = createSeoMetadata({
    title: 'How Demo Day Sports Scouting Works',
    description: 'See how athletes, guardians, teams, and verified scouts move through Demo Day’s structured sports evaluation and safeguarding pathway in Ghana.',
    path: '/how-it-works',
})

export default function HowItWorks() {
    return <SiteShell current="/how-it-works"><HowItWorksJourney /></SiteShell>
}
