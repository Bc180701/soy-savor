import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { createAdminUsersHandler } from './handler.ts'

Deno.test('lists all four administrator accounts once and ignores client-selected IDs', async () => {
  const ids = ['admin-1', 'admin-2', 'admin-3', 'admin-4']
  const lookedUp: string[] = []
  const handler = createAdminUsersHandler({
    authenticatedUserId: async () => ids[0],
    isSuperAdmin: async (id) => id === ids[0],
    adminIds: async () => [...ids, ids[0], null],
    accountById: async (id) => {
      lookedUp.push(id)
      return { id, email: `${id}@example.test`, created_at: '2026-11-18T12:00:00Z' }
    },
  })
  const response = await handler(new Request('http://localhost', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-token' },
    body: JSON.stringify({ userIds: ['unrelated-client'] }),
  }))
  assertEquals(response.status, 200)
  assertEquals(lookedUp, ids)
  assertEquals((await response.json()).users.map((user: { id: string }) => user.id), ids)
})

Deno.test('denies missing or invalid sessions and accounts without super-admin access before reading the directory', async () => {
  const handler = createAdminUsersHandler({
    authenticatedUserId: async (token) => token === 'regular-admin' ? 'admin-id' : null,
    isSuperAdmin: async () => false,
    adminIds: async () => { throw new Error('Must not read privileged roles') },
    accountById: async () => { throw new Error('Must not read accounts') },
  })
  for (const [token, status] of [[null, 401], ['invalid', 401], ['regular-admin', 403]] as const) {
    const response = await handler(new Request('http://localhost', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }))
    assertEquals(response.status, status)
  }
})