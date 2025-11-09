import { redirect } from "next/navigation"

interface EditPageProps {
  params: { id: string } | Promise<{ id: string }>
}

export default async function EditProductTemplateRedirect({ params }: EditPageProps) {
  const resolvedParams = await Promise.resolve(params)
  if (!resolvedParams) {
    redirect("/admin/products")
    return
  }

  redirect(`/admin/products/${resolvedParams.id}`)
}
