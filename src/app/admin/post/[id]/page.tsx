import { PostEditor } from '@/components/post/PostEditor'

export const metadata = {
  title: 'Editar Post – Feltro Fácil Blog Manager',
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  return <PostEditor postId={params.id} />
}
