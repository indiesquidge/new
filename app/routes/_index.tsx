import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="flex flex-wrap items-center justify-center max-w-screen-lg mx-auto">
      <div className="sm:mr-4">
        <h2 className="my-2">Transform</h2>
        <div className="border-gray border grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="w-20 h-20 bg-red-400"
              style={{ transform: "perspective(400px) rotateY(45deg)" }}
            />
          ))}
        </div>
      </div>

      <div className="">
        <h2 className="my-2">Perspective</h2>
        <div
          className="border-gray border grid grid-cols-3 gap-2"
          style={{ perspective: "400px" }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="w-20 h-20 bg-blue-400"
              style={{ transform: "rotateY(45deg)" }}
            />
          ))}
        </div>
      </div>
      <p className="p-8">
        The functional notation is useful when applying perspective to a single
        element. The effect breaks down when applying perspective to multiple
        elements because each has its own perspective, its own vanishing point.
        The <code>perspective</code> property on the parent element allows all
        chldren to share the same perspective.
      </p>
    </div>
  );
}
