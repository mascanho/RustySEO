import React from "react";

const About: React.FC = () => {
  return (
    <div className="about-section  dark:text-white space-y-4 pl-4 pr-3 text-xs pb-5 ">
      <img
        src={"/icon.png"}
        alt="Software Logo"
        className="w-32 h-auto m-auto dark:block hidden animate-pulse"
      />
      <img
        src={"/icon-light.png"}
        alt="Software Logo"
        className="w-32 h-auto m-auto dark:hidden block animate-pulse"
      />
      <p>
        Welcome to our innovative software! We've ingeniously combined the
        realms of marketing, coding, and AI to create a truly unique and
        powerful tool. Our vision? To revolutionize how these disciplines
        interact and enhance each other.
      </p>
      <p>
        This isn't just any ordinary software. It's a cutting-edge fusion of
        technology and creativity, born from the intersection of marketing
        expertise and coding brilliance, and nurtured by the latest advancements
        in artificial intelligence. We're pushing boundaries and redefining
        what's possible in this space.
      </p>
      <p>
        While we're constantly evolving and improving, we believe in
        transparency and collaboration. That's why we've embraced the
        open-source model. You have the opportunity to witness our development
        process firsthand, contribute your ideas, and be part of shaping the
        future of this groundbreaking software. Join us on this exciting journey
        of innovation and discovery!
      </p>

      <p>
        You can find us on{" "}
        <a
          href="https://github.com/mascanho/RustySEO"
          target="_blank"
          className="underline dark:text-white"
        >
          Github
        </a>{" "}
        and{" "}
        <a
          href="mailto:530rusty@gmail.com"
          className="underline dark:text-white"
        >
          Email
        </a>
        .
      </p>
    </div>
  );
};

export default About;
