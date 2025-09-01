import { Button } from "@/components/ui/button";

const Page = async () => {
  return (
    <div className=" flex justify-center items-center flex-col h-[100vh] mt-5 font-bold">
      Hello, NEXTJS
      <Button variant="destructive" className="mt-2">
        Click Me
      </Button>
    </div>
  );
};

export default Page;
