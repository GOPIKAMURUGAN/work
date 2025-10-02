import { useParams } from "react-router-dom";
import Master from "./Master";

export default function MasterDetail() {
  // parentId will be undefined on root level
  const { parentId } = useParams();

  return <Master parentId={parentId || null} />;
}
