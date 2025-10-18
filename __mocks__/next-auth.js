const mockAuth = jest.fn(async () => null);

const nextAuth = jest.fn(() => ({
  handlers: {},
  signIn: jest.fn(),
  signOut: jest.fn(),
  auth: mockAuth,
}));

nextAuth.__esModule = true;
nextAuth.mockAuth = mockAuth;

export default nextAuth;
export const mockNextAuthAuth = mockAuth;
