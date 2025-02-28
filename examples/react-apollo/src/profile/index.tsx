import React from 'react'

import { useHasuraClaims, useNhostClient, useUserData } from '@nhost/react'

import { ChangeEmail } from './change-email'
import { ChangePassword } from './change-password'
import { Mfa } from './mfa'
import { Button, Card, Container, Title } from '@mantine/core'
import { Prism } from '@mantine/prism'

export const ProfilePage: React.FC = () => {
  const claims = useHasuraClaims()
  const userData = useUserData()
  const nhost = useNhostClient()
  return (
    <Container>
      <Title>Profile page</Title>
      <Mfa />
      <ChangeEmail />
      <ChangePassword />
      <Card shadow="sm" p="lg" m="sm">
        <Title>User information</Title>
        {userData && <Prism language="json">{JSON.stringify(userData, null, 2)}</Prism>}
      </Card>
      <Card shadow="sm" p="lg" m="sm">
        <Title>Hasura JWT claims</Title>
        <Button fullWidth onClick={() => nhost.auth.refreshSession()}>
          Refresh session
        </Button>
        {claims && <Prism language="json">{JSON.stringify(claims, null, 2)}</Prism>}
      </Card>
    </Container>
  )
}
