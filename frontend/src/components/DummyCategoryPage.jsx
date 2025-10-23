import { useParams } from "react-router-dom";
import DummyCategoryList from "./DummyCategoryList";

function DummyCategoryPage() {
  const { parentId } = useParams();

  return (
    <div>
      <h1>{parentId ? "Dummy Subcategories" : "Dummy Categories"}</h1>
      <DummyCategoryList parentId={parentId || null} />
    </div>
  );
}

export default DummyCategoryPage;
