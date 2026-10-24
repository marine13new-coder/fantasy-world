using UnityEditor;
using UnityEngine;
using MCPForUnity.Editor.Services;
using MCPForUnity.Editor.Services.Transport;

namespace SeoulSurvival.Editor
{
    public static class McpAutomation
    {
        [InitializeOnLoadMethod]
        static void ConnectOnEditorOpen()
        {
            if(!Application.isBatchMode)
                EditorApplication.delayCall+=Connect;
        }
        [MenuItem("Seoul Survival/Connect local MCP")]
        public static async void Connect()
        {
            EditorPrefs.SetBool("MCPForUnity.UseHttpTransport",true);
            EditorPrefs.SetString("MCPForUnity.HttpUrl","http://127.0.0.1:8080");
            bool connected=await MCPServiceLocator.TransportManager.StartAsync(TransportMode.Http);
            Debug.Log(connected?"SEOUL_MCP_CONNECTED":"SEOUL_MCP_CONNECTION_FAILED");
        }
        public static void OpenAndConnect()
        {
            ProjectAutomation.Prepare(); Connect();
        }
    }
}
