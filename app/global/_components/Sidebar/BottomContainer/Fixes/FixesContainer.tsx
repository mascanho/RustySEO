import { useFixesStore } from "@/store/FixesStore";
import { FixesData } from "./FixesData";

const FixesContainer = () => {
  const { fix } = useFixesStore();

  // Find the matching fix object
  const filteredFixes = FixesData.filter((item) => item.title === fix);

  return (
    <section>
      <div className="w-full text-black flex justify-center items-center space-y-6 pt-10 flex-col">
        <span className="text-sm text-black font-bold dark:text-white ">
          {fix}
        </span>

        {filteredFixes.length > 0 && (
          <>
            <span className="text-xs text-black dark:text-white px-6">
              {filteredFixes[0].description}
            </span>

            <span className="text-xs text-black dark:text-white px-6 pt-1">
              {filteredFixes[0].fixes}
            </span>

            <div className="flex gap-8 pt-6">
              {filteredFixes[0].links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Link {index + 1}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FixesContainer;
