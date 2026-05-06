import { doc, getDoc } from "firebase/firestore"
import { db } from "./firestore"

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
