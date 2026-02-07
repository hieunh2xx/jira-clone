using AutoMapper;
using DataAccess.Models;
using ManagementProject.DTO;
namespace ManagementProject.Mappers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Sprint, SprintDto>()
                .ForMember(d => d.CreatorUsername, o => o.MapFrom(s => s.CreatedByNavigation.Username));
        }
    }
}