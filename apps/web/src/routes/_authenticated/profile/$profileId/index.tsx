import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/profile/$profileId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { profileId } = Route.useParams()
  return <div>Hello "/_authenticated/profile/{profileId}"!</div>
}
