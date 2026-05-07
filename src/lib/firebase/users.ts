import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore"
import { db } from "./firestore"

export interface UpdateUserProfileData {
  name: string
  phone?: string
}

export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileData,
): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    name: data.name,
    // deleteField() removes the Firestore field entirely instead of writing null,
    // preventing Zod parse failures on subsequent reads.
    phone: data.phone || deleteField(),
  })
}

export interface UserBasicInfo {
  id: string
  name: string
}

export async function getUsersByIds(userIds: string[]): Promise<UserBasicInfo[]> {
  if (!userIds || userIds.length === 0) return []

  try {
    const promises = userIds.map(async (id) => {
      const docRef = doc(db, "users", id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          name: data.name || data.displayName || "Usuário sem nome",
        } as UserBasicInfo
      }
      return null
    })

    const results = await Promise.all(promises)
    // Filter out nulls (users not found)
    return results.filter((user): user is UserBasicInfo => user !== null)
  } catch (error) {
    console.error("Error fetching users by IDs:", error)
    throw error
  }
}
