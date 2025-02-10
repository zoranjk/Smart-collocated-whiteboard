# LADICA

**LADICA** is a large shared display interface built on top of [tldraw](https://tldraw.dev) that leverages cutting-edge AI functionalities to enhance team collaboration. Large shared displays—such as digital whiteboards—are instrumental in supporting collocated team collaborations by facilitating cognitive tasks like brainstorming, organizing ideas, and making comparisons.

Recent advancements in Large Language Models (LLMs) have catalyzed AI support for these displays. However, most existing systems either offer limited capabilities or diminish human control, neglecting the potential benefits of natural group dynamics. Our formative study identified several cognitive challenges teams encounter, including:

- **Diverse Ideation:** Generating a wide range of ideas.
- **Knowledge Sharing:** Effectively distributing information among team members.
- **Mutual Awareness:** Keeping everyone updated on ongoing thoughts and progress.
- **Idea Organization:** Structuring and comparing different ideas.
- **Synchronizing Live Discussions:** Integrating real-time conversations with external workspaces.

In response, **LADICA** helps collaborative teams brainstorm, organize, and analyze ideas through multiple analytical lenses, all while fostering mutual awareness. Additionally, LADICA facilitates the real-time extraction of key information from verbal discussions and identifies relevant entities. A lab study has confirmed its usability and usefulness.

---

## Getting Started

Use this repo as a template to create LADICA style apps. To get started:

1. **Clone the Repository**  
   Use this repo as a template to create your LADICA project and clone it to your computer:
   ```bash
   git clone https://github.com/roryzhengzhang/Smart-collocated-whiteboard
2. **Install Dependencies**
   Run the following command to install all required packages:
   ```bash
   npm install 
3. **Get an OpenAI API Key**
   Get an OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys). Make sure
   you are at least a
   [Tier 1](https://platform.openai.com/docs/guides/rate-limits/usage-tiers) API
   user, which means you have access to GPT-4 Vision. You can check your tier on
   the [OpenAI API Limits](https://platform.openai.com/account/limits).
4. **Configure Environment Variables**
   Create a .env.local file in the project root that contains:
   ```bash
   OPENAI_API_KEY=your_api_key_here
5. **Run the Development Server**
   Start the application by running:
   ```bash
   npm run dev
6. **Access LADICA**
   Open http://localhost:3000 in your browser and start using LADICA!

## How It Works

LADICA integrates AI features into an interactive whiteboard environment, offering:

- **Brainstorming & Idea Organization:**  
  Utilize the infinite canvas to sketch, capture, and structure your team’s ideas.

- **AI-Enhanced Analysis:**  
  Leverage AI to analyze inputs, extract key information from live discussions, and identify relevant entities for deeper insight.

- **Real-Time Collaboration:**  
  With synchronized updates, every participant stays informed, promoting mutual awareness and effective teamwork.

These features collectively help teams overcome challenges such as diverse ideation, inefficient knowledge sharing, and difficulties in synchronizing live discussions with external workflows.

