interface Props {
  params: Promise<{
    projectId: string;
  }>;
}
const Page = async ({ params }: Props) => {
  const { projectId } = await params;
  return (
    <div>
      <h2>PROJECT ID</h2>
      <span>{projectId}</span>
    </div>
  );
};

export default Page;
