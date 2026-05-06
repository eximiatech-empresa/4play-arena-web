import { useQuery } from "@tanstack/react-query"
import { getUsersByIds, UserBasicInfo } from "@/lib/firebase/users"

export function useStudents(studentIds: string[]) {
  return useQuery<UserBasicInfo[]>({
    queryKey: ["students", studentIds],
    queryFn: () => getUsersByIds(studentIds),
    enabled: studentIds.length > 0,
  })
}
