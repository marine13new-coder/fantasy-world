using UnityEngine;
namespace SeoulSurvival
{
    [CreateAssetMenu(menuName="Seoul Survival/Game Balance")]
    public sealed class GameBalanceAsset : ScriptableObject
    {
        public GameBalance values=new GameBalance();
        public GameBalance RuntimeCopy(){var copy=JsonUtility.FromJson<GameBalance>(JsonUtility.ToJson(values));copy.Validate();return copy;}
    }
}
